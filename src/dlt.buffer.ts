import { EventEmitter } from 'events';
import { Buffer } from 'buffer';
import Packet, { IPacketData } from './dlt.packet';
import { DLTError, EErrorCode } from './dlt.error';

export { IPacketData };

export default class DLTBuffer extends EventEmitter {

    public static Events = {
        packet: 'packet',
        error: 'error',
    };

    private _buffer: Buffer = Buffer.alloc(0);

    constructor() {
        super();
    }

    public add(buffer: Buffer) {
        this._buffer = Buffer.concat([this._buffer, buffer]);
        let packet: DLTError | IPacketData | undefined;
        do {
            packet = this._read();
            if (packet instanceof DLTError) {
                // Error during parsing
                this.emit(DLTBuffer.Events.error, packet);
                break;
            }
            if (packet === undefined) {
                // Buffer size doesn't have "body" of message
                break;
            }
            // Trigger event
            this.emit(DLTBuffer.Events.packet, packet);
            if (this._buffer.length === 0) {
                // Buffer is read completely
                break;
            }
        } while (true);
    }

    public destroy() {
        // Drop buffer
        this._buffer = Buffer.alloc(0);
    }

    private _read(): DLTError | IPacketData | undefined {
        if (!Packet.canBeParsed(this._buffer)) {
            return undefined;
        }
        const processor: Packet = new Packet(this._buffer);
        const packet: IPacketData | DLTError = processor.read();
        if (packet instanceof DLTError) {
            return packet;
        }
        // Remove already read message from buffer
        this._buffer = processor.crop();
        return packet;
    }

}
