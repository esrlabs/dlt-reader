import { EventEmitter } from 'events';
import { Buffer } from 'buffer';
import Packet, { IPacketData } from './dlt.packet';

export { IPacketData };

export default class DLTBuffer extends EventEmitter {

    public static Events = {
        packet: 'packet',
        error: 'error',
    };

    private _buffer: Buffer = new Buffer(0);

    constructor() {
        super();
    }

    public add(buffer: Buffer) {
        this._buffer = Buffer.concat([this._buffer, buffer]);
        let error: Error | undefined;
        do {
            error = this._read();
            if (error instanceof Error) {
                this.emit(DLTBuffer.Events.error, error);
                break;
            }
            if (this._buffer.length === 0) {
                break;
            }
        } while (true);
    }

    private _read(): Error | undefined {
        const processor: Packet = new Packet(this._buffer);
        const packet: IPacketData | Error = processor.read();
        if (packet instanceof Error) {
            return packet;
        }
        // Remove already read message from buffer
        this._buffer = processor.crop();
        // Trigger event
        this.emit(DLTBuffer.Events.packet, packet);
    }

}
