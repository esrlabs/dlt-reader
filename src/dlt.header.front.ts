import { ABufferReader } from './interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from './dlt.error';

export const Parameters = {
    MIN_LEN: 16,
    DLTPattern: 0x444C5401,
};

export interface ITimestamp {
    seconds: number;
    mircoseconds: number;
    unixstamp: number;
}

/**
 * @class Header
 * @classdesc FrontHeader
 * @property {ITimestamp}   Timestamp    - Timestamp
 * @property {string}       ECUID        - ECU ID
 */
export class Header extends ABufferReader {

    public timestamp:   ITimestamp = {      // Timestamp
        seconds: -1,
        mircoseconds: -1,
        unixstamp: -1,
    };
    public ECUID:       string = '';        // ECU ID

    constructor(buffer: Buffer) {
        super(buffer, true);
    }

    public static getRequiredLength(): number {
        return Parameters.MIN_LEN;
    }

    public read(): DLTError | undefined {
        if (this._buffer.length < Parameters.MIN_LEN) {
            return new DLTError(`Minimal length of standard header is ${Parameters.MIN_LEN} bytes, but size of buffer is ${this._buffer.length} bytes.`, EErrorCode.HEADER_MIN_LEN);
        }
        // Read DLT pattern
        const pattern = this.readUInt32();
        if (pattern !== Parameters.DLTPattern) {
            return new DLTError(`Cannot find DLT-pattern at the beggining of message`, EErrorCode.NO_DLT_PATTERN);
        }
        // Read seconds
        this.timestamp.seconds = this.readUInt32(false);
        // Read micrfoseconds
        this.timestamp.mircoseconds = this.readInt32(false);
        // Calculate unix time
        this.timestamp.unixstamp = Math.abs(this.timestamp.mircoseconds) / 1000 + this.timestamp.seconds * 1000;
        // Read ECU Id
        this.ECUID = this._buffer.slice(this._offset, this._offset + 4).toString('ascii');
        this._offset += 4;
    }

    public getOffset(): number {
        return this._offset;
    }

    public crop(): Buffer {
        return this._buffer.slice(this._offset, this._buffer.length);
    }

}
