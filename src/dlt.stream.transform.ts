import { Transform, TransformOptions, TransformCallback } from 'stream';
import { Header, ITimestamp } from './dlt.header.front';
import { DLTError, EErrorCode } from './dlt.error';
import Packet, { IPacketData } from './dlt.packet';

export interface IStoredPacket {
    packet: IPacketData;
    timestamp: ITimestamp;
    EDUID: string;
    str?: string;
}

export type TConvertorFunc = (packets: IStoredPacket[]) => Buffer | string;

export interface IOptions {
    stopOnError?: boolean;
    stringify?: boolean;
    datetime?: boolean;
    convertor?: TConvertorFunc | undefined;
}

export default class DLTFileReadStream extends Transform {

    public static Events = {
        packet: 'packet',
        chunk: 'chunk',
        error: 'error',
    };

    private _buffer: Buffer = new Buffer(0);
    private _header: Header | undefined;
    private _packets: number = 0;
    private _bytes: number = 0;
    private _options: IOptions = {
        stopOnError: false,
        stringify: false,
        datetime: false,
        convertor: undefined,
    };

    constructor(transformOptions: TransformOptions | undefined, readerOption?: IOptions) {
        super(transformOptions);
        if (readerOption !== undefined) {
            Object.assign(this._options, readerOption);
        }
    }

    public _transform(buffer: Buffer, encoding: string, callback: TransformCallback) {
        let output: string = '';
        this._buffer = Buffer.concat([this._buffer, buffer]);
        this._bytes += buffer.length;
        let packet: DLTError | IStoredPacket | undefined;
        const packets: IStoredPacket[] = [];
        do {
            packet = this._readChunk();
            if (packet instanceof DLTError) {
                // Error during parsing
                this.emit(DLTFileReadStream.Events.error, packet);
                if (this._options.stopOnError) {
                    // Stop on error
                    callback(new Error(`${packet.code}: ${packet.message}`), undefined);
                    return;
                }
                break;
            }
            if (packet === undefined) {
                // Buffer size doesn't have "body" of message
                break;
            }
            // Trigger event for new packet
            this.emit(DLTFileReadStream.Events.packet, packet);
            if (this._options.stringify) {
                output += `${packet.str}\n`;
            }
            if (this._options.convertor !== undefined) {
                packets.push(packet);
            }
            this._packets += 1;
            if (this._buffer.length === 0) {
                // Buffer is read completely
                break;
            }
        } while (true);
        // Trigger chunk event
        this.emit(DLTFileReadStream.Events.chunk, this._bytes, this._packets);
        // Callback
        if (this._options.convertor !== undefined) {
            callback(undefined, this._options.convertor(packets));
        } else if (this._options.stringify) {
            callback(undefined, output);
        } else {
            callback(undefined, buffer);
        }
    }

    private _readChunk(): DLTError | IStoredPacket | undefined {
        // Check minimal length
        if (this._buffer.length < Header.getRequiredLength() && this._header === undefined) {
            // Wait for more data
            return undefined;
        }
        // Extract front header
        if (this._header === undefined) {
            this._header = new Header(this._buffer);
            const readHeaderResult: DLTError | undefined = this._header.read();
            if (readHeaderResult instanceof DLTError) {
                this._header = undefined;
                return readHeaderResult;
            }
            // Crop buffer
            this._buffer = this._header.crop();
        }
        // Try to read packet
        if (!Packet.canBeParsed(this._buffer)) {
            return undefined;
        }
        const processor: Packet = new Packet(this._buffer);
        const packet: IPacketData | DLTError = processor.read(true);
        if (packet instanceof DLTError) {
            return packet;
        }
        let str: string | undefined;
        if (this._options.stringify) {
            str = `${this._getDatetime(this._header.timestamp.unixstamp)} ${this._header.ECUID} ${packet.standardHeader.toString()}`;
            if (packet.extendedHeader !== undefined) {
                str += ' ' + packet.extendedHeader.toString();
            }
            if (packet.payload !== undefined && packet.payload.content instanceof Array) {
                str += (' ' + packet.payload.content.map((value) => {
                    return value.str;
                }).join(' '));
            }
        }
        const result = { packet: packet, timestamp: this._header.timestamp, EDUID: this._header.ECUID, str: str };
        // Remove already read message from buffer
        this._buffer = processor.crop();
        // Drop header
        this._header = undefined;
        return result;
    }

    private _getDatetime(unixstamp: number): string {
        if (this._options.datetime) {
            const date: Date = new Date(unixstamp);
            return this._isDateValid(date) ? `${date.toLocaleString()}.${date.getMilliseconds()}` : `${unixstamp}`;
        } else {
            return `${unixstamp}`;
        }
    }

    private _isDateValid(date: Date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

}
