import { Buffer } from 'buffer';
import * as PayloadConsts from '../dlt.payload.arguments.consts';
import TypeInfo from '../dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from '../interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from '../dlt.error';

export interface IData {
    value: Buffer;
    name: string | undefined;
    count: number;
}

export default class STRG extends APayloadTypeProcessor<IData> {

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, info, MSBF);
    }

    public read(): IData | DLTError {
        const result: IData = { value: new Buffer(0), count: 0, name: undefined };
        result.count = this.readUInt16();
        result.name = this._getName();
        // Here is implementation
        this._offset += length;
        return result;
    }

    public crop(): Buffer {
        return this._buffer.slice(this._offset, this._buffer.length);
    }

    private _getName(): string | undefined {
        if (!this._info.VARI) {
            return undefined;
        }
        const length = this.readUInt16();
        const value = this._buffer.slice(this._offset, this._offset + length).toString('ascii');
        this._offset += length;
        return value;
    }

}
