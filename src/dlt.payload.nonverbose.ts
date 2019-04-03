import { Buffer } from 'buffer';
import { DLTError, EErrorCode } from './dlt.error';

export default class PayloadNonVerbose {

    public messageId: number = -1;

    private _buffer: Buffer;
    private _offset: number = 0;
    private _MSBF: boolean; // MSB First: true - payload BE; false - payload LE

    constructor(buffer: Buffer, MSBF: boolean) {
        this._buffer = buffer;
        this._MSBF = MSBF;
        this.messageId = this._buffer.readUInt32LE(this._offset);
        this._offset += 4;
    }

    public read(): any {
        return null;
    }

}
