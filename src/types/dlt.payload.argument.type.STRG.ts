import { Buffer } from 'buffer';
import * as PayloadConsts from '../dlt.payload.arguments.consts';
import TypeInfo from '../dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from '../interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from '../dlt.error';

export interface IData {
    value: string | undefined;
    name: string | undefined;
}

export default class STRG extends APayloadTypeProcessor<IData> {

    private _value: string | undefined;
    private _name: string | undefined;

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, info, MSBF);
    }

    public read(): IData | DLTError {
        const length: number = this.readUInt16();
        this._name = this._getName();
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
        return { value: this._value, name: this._name };
    }

    public toString(): string {
        if (this._name === undefined) {
            return `${this._value}`;
        } else {
            return `${this._name}=${this._value}`;
        }
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
