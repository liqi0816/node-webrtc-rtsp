import { v4 as generateUuid } from 'uuid';
import ConnectionDefault from './connection.js';

export default class ConnectionManager<TConnection extends ConnectionDefault = ConnectionDefault> {
    Connection: new (...args: ConstructorParameters<typeof ConnectionDefault>) => TConnection;
    generateUuid = generateUuid;
    connections = {} as Record<string, TConnection | undefined>;

    constructor(Connection: new (...args: ConstructorParameters<typeof ConnectionDefault>) => TConnection) {
        this.Connection = Connection;
    }

    createId() {
        while (true) {
            const id = this.generateUuid();
            if (!this.connections[id]) return id;
        }
    }

    createConnection() {
        const id = this.createId();
        const connection = new this.Connection(id);
        connection.once('close', () => this.connections[id] = undefined);
        return this.connections[id] = connection;
    }

    toJSON() {
        return Object.values(this.connections).map(connection => connection!.toJSON());
    }
}
