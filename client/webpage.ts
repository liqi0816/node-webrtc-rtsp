import { ClientRTCPeerConnection } from './client.js';

declare global {
    interface Window {
        stream: MediaStream
        track: MediaStreamTrack
        video: HTMLVideoElement
        peer: ClientRTCPeerConnection
    }
}

(async () => {
    const code = document.getElementsByTagName('code')[0];
    const startRecord = document.getElementById('startRecord') as HTMLButtonElement;
    const stopRecord = document.getElementById('stopRecord') as HTMLButtonElement;

    const stream = window.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 4096, height: 2160 },
    });
    const track = window.track = stream.getTracks()[0];

    const video = window.video = document.getElementsByTagName('video')[0];
    video.srcObject = stream;

    const peer = window.peer = new ClientRTCPeerConnection();
    peer.addTrack(track, stream);
    code.textContent += `${JSON.stringify(track.getSettings(), null, 4)}\n`;

    startRecord.onclick = async () => {
        code.textContent += `startRecord:${await (await fetch(`./connections/${peer.id}/record`, {
            method: 'post', body: new URLSearchParams({ status: 'started' })
        })).text()}`;
    }
    stopRecord.onclick = async () => {
        code.textContent += `stopRecord:${await (await fetch(`./connections/${peer.id}/record`, {
            method: 'post', body: new URLSearchParams({ status: 'stopped' })
        })).text()}`;

    }

    await peer.initialize();
    code.textContent += 'peer connected\n';
})();

