import { Buffer } from 'buffer';
import * as PayloadConsts from '../dlt.payload.arguments.consts';
import TypeInfo from '../dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from '../interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from '../dlt.error';

export interface IData {
    value: Buffer | undefined;
    name: string | undefined;
}

export default class RAWD extends APayloadTypeProcessor<IData> {

    private _value: Buffer | undefined;
    private _name: string | undefined;

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, info, MSBF);
    }

    public read(): IData | DLTError {
        const length: number = this.readUInt16();
        this._name = this._getName();
        this._value = this._buffer.slice(this._offset, this._offset + length);
        this._offset += length;
        return { value: this._value, name: this._name };
    }

    public toString(): string {
        if (this._name === undefined) {
            return `[${Uint8Array.from((this._value as Buffer)).join(' ')}]`;
        } else {
            return `${this._name}: [${Uint8Array.from((this._value as Buffer)).join(' ')}]`;
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
