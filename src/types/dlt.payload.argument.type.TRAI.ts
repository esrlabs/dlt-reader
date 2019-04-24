import * as PayloadConsts from '../dlt.payload.arguments.consts';
import TypeInfo from '../dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from '../interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from '../dlt.error';

export interface IData {
    value: string | undefined;
}

export default class TRAI extends APayloadTypeProcessor<IData> {

    private _value: string | undefined;

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, info, MSBF);
    }

    public read(): IData | DLTError {
        const length: number = this.readUInt16();
        switch (this._info.SCODValue) {
            case 0:
                this._value = this._buffer.slice(this._offset, this._offset + length).toString('ascii');
                break;
            case 1:
                this._value = this._buffer.slice(this._offset, this._offset + length).toString('utf8');
                break;
            default:
                this._value = this._buffer.slice(this._offset, this._offset + length).toString('utf8');
                break;
        }
        this._offset += length;
        return { value: this._value };
    }

    public toString(): string {
        return `${this._value}`;
    }

    public crop(): Buffer {
        return this._buffer.slice(this._offset, this._buffer.length);
    }

}
