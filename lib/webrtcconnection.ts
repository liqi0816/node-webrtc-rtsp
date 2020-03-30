import { RTCPeerConnection } from 'wrtc';
import Connection from './connection.js';

export default class WebRtcConnection extends Connection {
    protected static RTCPeerConnection = RTCPeerConnection;
    protected static clearTimeout = clearTimeout;
    protected static setTimeout = setTimeout;

    static TIME_TO_CONNECTED = 10000;
    static TIME_TO_HOST_CANDIDATES = 3000;  // NOTE(mroberts): Too long.
    static TIME_TO_RECONNECTED = 10000;
    timeToConnected = WebRtcConnection.TIME_TO_CONNECTED;
    timeToHostCandidates = WebRtcConnection.TIME_TO_HOST_CANDIDATES;
    timeToReconnected = WebRtcConnection.TIME_TO_RECONNECTED;

    peerConnection = new WebRtcConnection.RTCPeerConnection({ sdpSemantics: 'unified-plan' } as any);

    private connectionTimer?: NodeJS.Timeout
    private reconnectionTimer?: NodeJS.Timeout
    async connect() {
        const { peerConnection } = this;
        const { setTimeout, clearTimeout } = WebRtcConnection;

        this.connectionTimer = setTimeout(() => {
            if (peerConnection.iceConnectionState !== 'connected'
                && peerConnection.iceConnectionState !== 'completed') {
                this.close();
            }
        }, this.timeToConnected);

        peerConnection.addEventListener('iceconnectionstatechange', () => {
            if (peerConnection.iceConnectionState === 'connected'
                || peerConnection.iceConnectionState === 'completed') {
                if (this.connectionTimer) clearTimeout(this.connectionTimer);
                if (this.reconnectionTimer) clearTimeout(this.reconnectionTimer);
                this.connectionTimer = this.reconnectionTimer = undefined;
            }
            else if (peerConnection.iceConnectionState === 'disconnected'
                || peerConnection.iceConnectionState === 'failed') {
                if (!this.connectionTimer && !this.reconnectionTimer) {
                    this.reconnectionTimer = setTimeout(() => this.close(), this.timeToReconnected);
                }
            }
        });
    }

    private attemptTimer?: NodeJS.Timeout
    async offer() {
        const { peerConnection } = this;
        const { setTimeout, clearTimeout } = WebRtcConnection;
        this.emit('beforeoffer', { peerConnection });
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        try {
            if (peerConnection.iceGatheringState === 'complete') {
                return this;
            }

            await new Promise((resolve, reject) => {
                this.attemptTimer = setTimeout(() => {
                    reject(new Error('Timed out waiting for host candidates'));
                }, this.timeToHostCandidates);

                peerConnection.addEventListener('icecandidate', ({ candidate }: { candidate: unknown }) => {
                    if (!candidate) {
                        clearTimeout(this.attemptTimer!);
                        resolve();
                    }
                });
            });
            this.emit('afteroffer', { peerConnection });
            return this;
        }
        catch (error) {
            this.close();
            throw error;
        }
    }

    async applyAnswer(answer: RTCSessionDescriptionInit) {
        return await this.peerConnection.setRemoteDescription(answer);
    };

    close() {
        const { clearTimeout } = WebRtcConnection;
        if (this.connectionTimer) clearTimeout(this.connectionTimer);
        if (this.reconnectionTimer) clearTimeout(this.reconnectionTimer);
        this.connectionTimer = this.reconnectionTimer = undefined;
        this.peerConnection.close();
        return super.close();
    }

    toJSON() {
        const { iceConnectionState, localDescription, remoteDescription, signalingState } = this;
        return { iceConnectionState, localDescription, remoteDescription, signalingState, ...super.toJSON() };
    }

    get iceConnectionState() {
        return this.peerConnection.iceConnectionState;
    }
    get localDescription() {
        return WebRtcConnection.descriptionToJSON(this.peerConnection.localDescription, true);
    }
    get remoteDescription() {
        return WebRtcConnection.descriptionToJSON(this.peerConnection.remoteDescription);
    }
    get signalingState() {
        return this.peerConnection.signalingState;
    }

    static descriptionToJSON(description: { type: string, sdp: string } | null, shouldDisableTrickleIce = false) {
        return !description ? {} : {
            type: description.type,
            sdp: shouldDisableTrickleIce ? WebRtcConnection.disableTrickleIce(description.sdp) : description.sdp
        };
    }

    static disableTrickleIce(sdp: string) {
        return sdp.replace(/\r\na=ice-options:trickle/g, '');
    }
}
