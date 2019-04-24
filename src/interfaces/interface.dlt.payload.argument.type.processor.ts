// tslint:disable:max-classes-per-file

import TypeInfo from "../dlt.payload.argument.type.info";
import { DLTError } from '../dlt.error';

export abstract class ABufferReader {

    public readonly _buffer: Buffer;
    public readonly _MSBF: boolean; // MSB First: true - payload BE; false - payload LE
    public _offset: number = 0;

    constructor(buffer: Buffer, MSBF: boolean) {
        this._MSBF = MSBF;
        this._buffer = buffer;
    }

    public readInt8(MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readInt8(this._offset) : this._buffer.readInt8(this._offset);
            this._offset += 1;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readInt16(MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readInt16BE(this._offset) : this._buffer.readInt16LE(this._offset);
            this._offset += 2;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readInt32(MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readInt32BE(this._offset) : this._buffer.readInt32LE(this._offset);
            this._offset += 4;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readInt(byteLength: number, MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readIntBE(this._offset, byteLength) : this._buffer.readIntLE(this._offset, byteLength);
            this._offset += byteLength;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readUInt8(MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readUInt8(this._offset) : this._buffer.readUInt8(this._offset);
            this._offset += 1;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readUInt16(MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readUInt16BE(this._offset) : this._buffer.readUInt16LE(this._offset);
            this._offset += 2;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readUInt32(MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readUInt32BE(this._offset) : this._buffer.readUInt32LE(this._offset);
            this._offset += 4;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readUInt(byteLength: number, MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readUIntBE(this._offset, byteLength) : this._buffer.readUIntLE(this._offset, byteLength);
            this._offset += byteLength;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readFloat(MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readFloatBE(this._offset) : this._buffer.readFloatLE(this._offset);
            this._offset += 4;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    public readDouble(MSBF?: boolean): number {
        let value: number = 0;
        try {
            value = (MSBF === undefined ? this._MSBF : MSBF) ? this._buffer.readDoubleBE(this._offset) : this._buffer.readDoubleLE(this._offset);
            this._offset += 8;
        } catch (extractError) {
            this._postErrorData(extractError);
        }
        return value;
    }

    private _postErrorData(error: Error) {
        console.error(`Buffer: size ${this._buffer.length} / ${this._buffer.byteLength}. Offset: ${this._offset}. Bytes: [${Uint8Array.from(this._buffer).join(', ')}]`);
        throw error;
    }

}

export abstract class APayloadTypeProcessor<T> extends ABufferReader {

    public readonly _info: TypeInfo;

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, MSBF);
        this._info = info;
    }

    public abstract read(): T | DLTError;
    public abstract toString(): string;
    public abstract crop(): Buffer;

}
