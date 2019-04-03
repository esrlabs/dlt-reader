import { Buffer } from 'buffer';
import Header, { Standard, Extended } from './dlt.header';
import Payload, { IPayloadData } from './dlt.payload';
import { DLTError, EErrorCode } from './dlt.error';

export interface IPacketData {
    standardHeader: Standard.Header;
    extendedHeader: Extended.Header | undefined;
    payload: IPayloadData | undefined;
    length: number;
}

export default class Packet {

    private _buffer: Buffer;
    private _length: number = 0;

    constructor(buffer: Buffer) {
        this._buffer = buffer;
    }

    public read(): IPacketData | DLTError {
        // Create header
        const header: Header = new Header(this._buffer);
        // Try to read header
        const headerReadingError: DLTError | undefined = header.read();
        if (headerReadingError instanceof DLTError) {
            return headerReadingError;
        }
        if (header.standard === undefined) {
            return new DLTError(`Fail to read standard header. This message is a signal: parser has some error, because this message should not appear at all. Never.`, EErrorCode.UNKNOWN);
        }
        this._length = header.standard.LEN;
        // Extract message bytes
        const payloadBuffer: Buffer = this._buffer.slice(header.getOffset(), this._length);
        // Create payload processor
        const processor: Payload = new Payload(payloadBuffer, header);
        // Read payload data
        const payload: IPayloadData | DLTError = processor.read();
        if (payload instanceof DLTError) {
            return payload;
        }
        return {
            standardHeader: header.standard,
            extendedHeader: header.extended,
            payload: payload,
            length: header.standard.LEN,
        };
    }

    public crop(): Buffer {
        return this._buffer.slice(this._length, this._buffer.length);
    }
}
