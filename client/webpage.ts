import { ClientRTCPeerConnection } from './client.js';

declare global {
    interface Window {
        stream: MediaStream
        video: HTMLVideoElement
        peer: ClientRTCPeerConnection
    }
}

(async () => {
    const stream = window.stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = window.video = document.getElementsByTagName('video')[0];
    video.srcObject = stream;

    const peer = window.peer = new ClientRTCPeerConnection();
})();

