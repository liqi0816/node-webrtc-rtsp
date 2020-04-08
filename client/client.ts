import { ServerRTCPeerConnection } from '../server/peer.js';

export class ClientRTCPeerConnection extends RTCPeerConnection {
    id: string | null = null;
    endpoint = 'http://127.0.0.1';

    async initialize() {
        this.dispatchEvent(new Event('beforeinitialize'));
        const remote = await (await fetch(`${this.endpoint}/connections`, { method: 'POST' })).json() as ServerRTCPeerConnection['description'];
        if (!remote.id) throw new TypeError('remote.id invalid');
        if (!remote.localDescription) throw new TypeError('remote.localDescription invalid');
        this.id = remote.id;
        await this.setRemoteDescription(remote.localDescription);

        this.dispatchEvent(new Event('beforeanswer'));
        const answer = await this.createAnswer();
        this.dispatchEvent(new CustomEvent('answer', { detail: answer }));

        await this.setLocalDescription(answer);
        await fetch(`${this.endpoint}/connections/${remote.id}/remote-description`, {
            method: 'POST',
            body: JSON.stringify(this.localDescription),
            headers: { 'Content-Type': 'application/json' }
        });
        this.dispatchEvent(new Event('initialize'));
        return this.description;
    }

    get description() {
        const { id, iceConnectionState, localDescription, remoteDescription, signalingState } = this;
        return { id, iceConnectionState, localDescription, remoteDescription, signalingState };
    }

    close() {
        super.close();
        fetch(`${this.endpoint}/connections/${this.id}`, { method: 'DELETE' }).catch(() => { });
        this.dispatchEvent({ type: 'close' } as Event);
    }

    static disableTrickleIce(sdp: string) {
        return sdp.replace(/\r\na=ice-options:trickle/g, '');
    }
}
