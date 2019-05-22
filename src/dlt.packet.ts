import { Buffer } from 'buffer';
import Header, { Standard, Extended } from './dlt.header';
import Payload, { IPayloadData } from './dlt.payload';
import { DLTError, EErrorCode } from './dlt.error';

export enum EColumn {
    ECUID = 'ECUID',        // ECU Id
    DATETIME = 'DATETIME',  // Generate datetime from unixtime of message
    // Standard header
    UEH = 'UEH',            // Use Extended Header
    MSBF = 'MSBF',          // MSB First: true - payload BE; false - payload LE
    WEID = 'WEID',          // With ECU ID
    WSID = 'WSID',          // With Session ID
    WTMS = 'WTMS',          // With Timestamp
    VERS = 'VERS',          // Version Number
    MCNT = 'MCNT',          // Message Counter
    LEN = 'LEN',            // Length of the complete message in bytes
    SID = 'SID',            // Session ID
    TMS = 'TMS',            // Timestamp
    EID = 'EID',            // ECU ID (ECU)
    // Extended header
    MSIN = 'MSIN',          // Message Info
    VERB = 'VERB',          // Verbose
    MSTP = 'MSTP',          // Message Type
    MTIN = 'MTIN',          // Message Type Info
    NOAR = 'NOAR',          // Number of arguments
    APID = 'APID',          // Application ID
    CTID = 'CTID',          // Context ID
    // Payload
    PAYLOAD = 'PAYLOAD',    // Payload
}

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

    public read(includeStrValue: boolean = false): IPacketData | DLTError {
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
        const payload: IPayloadData | DLTError = processor.read(includeStrValue);
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

    public static canBeParsed(buffer: Buffer): boolean {
        const length: number | undefined = Standard.Header.getLength(buffer);
        if (length === undefined) {
            return false;
        }
        return buffer.length >= length;
    }
}
