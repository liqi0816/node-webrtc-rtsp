import ConnectionManager from './connectionmanager.js';
import WebRtcConnection from './webrtcconnection.js';

export default class WebRtcConnectionManager extends ConnectionManager<WebRtcConnection> {
    constructor() {
        super(WebRtcConnection);
    }

    async initiateConnection() {
        const connection = this.createConnection();
        return await connection.offer();
    }
}
