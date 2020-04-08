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

    for (const track of stream.getTracks()) {
        peer.addTrack(track, stream);
    }
    
    await peer.initialize();
    console.log('peer connected');
})();

