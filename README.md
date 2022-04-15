# Description

This project demonstrates how to use the [nodejs module wrtc](https://www.npmjs.com/package/wrtc) to covert a WebRTC live capture from a browser to an RTSP stream.

This work is based on [node-webrtc/node-webrtc-examples](https://github.com/node-webrtc/node-webrtc-examples) (record-audio-video-stream).

# Setup

```bash
npm install
npm run build
```

This project does not require any external system-wide dependencies.

# Demo

## Run the rtsp server

```bash
node ./build/rtsp/rtsp.js
```

## Run the webrtc server

```bash
node ./build/server/server.js
```

## Frontend

Navigate to http://127.0.0.1:8080 Then click `startRecord`. An id will be allocated.

## Playback

Get a rtsp player and use this URL:

```
rtsp://127.0.0.1:6554/${id}
```

For `ffplay`, the command should be:

```bash
ffplay rtsp://127.0.0.1:6554/${id}
```

# Troubleshooting

## Framerate incorrect

This is a weird bug and I don't know how to solve it ultimately.

```
frameRate = 29.97              => everything ok
frameRate = 29.97002983093261  => everything ok
frameRate = 29.970029830932614 => everything ok
frameRate = 29.970029830932617 => real fps received at server = ~60
```

The workaround however is simple: fix `frameRate` to 29.97 or whatever else working value on both browser and server.

