import { RTCPeerConnection, RTCVideoSink } from 'wrtc';
import { sleep } from '../common/util.js';
import { randomBytes } from 'crypto';
import { promisify } from 'util';

export const randomBytesAsync = promisify(randomBytes);

export class ServerRTCPeerConnection extends RTCPeerConnection {
    id: string
    creationTimestamp: ReturnType<typeof Date.now>

    static TIME_TO_CONNECTED = 10000;
    static TIME_TO_HOST_CANDIDATES = 3000;  // NOTE(mroberts): Too long.
    static TIME_TO_RECONNECTED = 10000;
    timeToConnected = ServerRTCPeerConnection.TIME_TO_CONNECTED;
    timeToHostCandidates = ServerRTCPeerConnection.TIME_TO_HOST_CANDIDATES;
    timeToReconnected = ServerRTCPeerConnection.TIME_TO_RECONNECTED;

    constructor(id: string, configuration?: RTCConfiguration) {
        super(configuration);
        this.id = id;
        this.creationTimestamp = Date.now();
    }

    videoTransceiver: RTCRtpTransceiver | null = null;
    videoSink: RTCVideoSink | null = null;
    async initialize() {
        this.dispatchEvent({ type: 'beforeinitialize' } as Event);
        this.videoTransceiver = this.addTransceiver('video');
        this.videoSink = new RTCVideoSink(this.videoTransceiver.receiver.track);
        const offer = await this.createOffer({ offerToReceiveVideo: true });
        await this.setLocalDescription(offer);
        await sleep(0);

        if (this.iceGatheringState !== 'complete') {
            await sleep(this.timeToHostCandidates);
            //@ts-ignore: condition will not always return 'true' because we slept
            if (this.iceGatheringState !== 'complete') {
                this.dispatchEvent({ type: 'icegatheringtimeout' } as Event);
                this.close();
                throw new Error('icegatheringtimeout');
            }
        }

        this.dispatchEvent({ type: 'initialize' } as Event);
        void (async () => {
            await sleep(this.timeToConnected);
            if (!['connected', 'completed'].includes(this.iceConnectionState)) {
                this.dispatchEvent({ type: 'connectiontimeout' } as Event);
                this.close();
            };
        })();
        return this.description;
    }

    async respond(answer: RTCSessionDescription) {
        await this.setRemoteDescription(answer);
        this.addEventListener('iceconnectionstatechange', async () => {
            if (['disconnected', 'failed'].includes(this.iceConnectionState)) {
                await sleep(this.timeToReconnected);
                if (['disconnected', 'failed'].includes(this.iceConnectionState)) {
                    this.dispatchEvent({ type: 'reconnectiontimeout' } as Event);
                    this.close();
                };
            };
        });
        return this.description;
    }

    get description() {
        const { id, iceConnectionState, localDescription, remoteDescription, signalingState } = this;
        return { id, iceConnectionState, localDescription, remoteDescription, signalingState };
    }

    get localDescription(): RTCSessionDescription | null {
        const localDescription = super.localDescription;
        if (!localDescription) return localDescription;

        return { ...localDescription, sdp: ServerRTCPeerConnection.disableTrickleIce(localDescription.sdp) };
    }

    close() {
        super.close();
        this.dispatchEvent({ type: 'close' } as Event);
    }

    static disableTrickleIce(sdp: string) {
        return sdp.replace(/\r\na=ice-options:trickle/g, '');
    }

    static async genId() {
        return (await randomBytesAsync(24)).toString('hex');
    }
};
