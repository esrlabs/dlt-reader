import * as PayloadConsts from '../dlt.payload.arguments.consts';
import TypeInfo from '../dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from '../interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from '../dlt.error';

export interface IData {
    value: boolean;
    name: string | undefined;
}

export default class BOOL extends APayloadTypeProcessor<IData> {

    private _value: boolean | undefined;
    private _name: string | undefined;

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, info, MSBF);
    }

    public read(): IData | DLTError {
        this._name = this._getName();
        this._value = this.readUInt8() === 1;
        return {
            value: this._value,
            name: this._name,
        };
    }

    public toString(): string {
        if (this._name === undefined) {
            return `${this._value ? 'true' : 'false'}`;
        } else {
            return `${this._name}=${this._value ? 'true' : 'false'}`;
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
