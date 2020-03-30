import { EventEmitter } from 'events';

export default class Connection extends EventEmitter {
    id: string
    state: 'open' | 'closed'

    constructor(id: string) {
        super();
        this.id = id;
        this.state = 'open';
    }

    close() {
        this.state = 'closed';
        return this.emit('closed');
    }

    toJSON() {
        const { id, state } = this;
        return { id, state };
    }
}
