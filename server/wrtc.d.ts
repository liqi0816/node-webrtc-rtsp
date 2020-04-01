type RTCPeerConnectionConstructor = typeof RTCPeerConnection;

declare module 'wrtc' {
    const RTCPeerConnection: RTCPeerConnectionConstructor;
    interface FrameEvent extends Event {
        frame: { width: number, height: number, data: Buffer }
    }
    class RTCVideoSink extends EventTarget {
        constructor(track: MediaStreamTrack);
        addEventListener(type: 'frame', listener: (event: FrameEvent) => void): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
    }
}
