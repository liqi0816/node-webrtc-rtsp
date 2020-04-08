type RTCPeerConnectionConstructor = typeof RTCPeerConnection;

declare module 'wrtc' {
    const RTCPeerConnection: RTCPeerConnectionConstructor;

    namespace nonstandard {
        interface FrameEvent extends Event {
            frame: { width: number, height: number, data: Uint8ClampedArray }
        }

        class RTCVideoSink extends EventTarget {
            constructor(track: MediaStreamTrack);
            addEventListener(type: 'frame', listener: ((event: FrameEvent) => void) | null, options?: boolean | AddEventListenerOptions): void;
            addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
            removeEventListener(type: 'frame', listener: (event: FrameEvent) => void, options?: boolean | EventListenerOptions): void;
            removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
        }
    }
}
