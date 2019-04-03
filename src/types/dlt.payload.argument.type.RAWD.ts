import { Buffer } from 'buffer';
import * as PayloadConsts from '../dlt.payload.arguments.consts';
import TypeInfo from '../dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from '../interfaces/interface.dlt.payload.argument.type.processor';

export interface IData {
    value: Buffer;
    name: string | undefined;
}

export default class RAWD extends APayloadTypeProcessor<IData> {

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, info, MSBF);
    }

    public read(): IData | Error {
        const result: IData = { value: new Buffer(0), name: undefined };
        const length: number = this.readUInt16();
        result.name = this._getName();
        result.value = this._buffer.slice(this._offset, this._offset + length);
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
