import { Buffer } from 'buffer';
import * as PayloadConsts from '../dlt.payload.arguments.consts';
import TypeInfo from '../dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from '../interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from '../dlt.error';

export interface IData {
    value: string;
}

export default class TRAI extends APayloadTypeProcessor<IData> {

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, info, MSBF);
    }

    public read(): IData | DLTError {
        const result: IData = { value: '' };
        const length: number = this.readUInt16();
        switch (this._info.SCODValue) {
            case 0:
                result.value = this._buffer.slice(this._offset, this._offset + length).toString('ascii');
                break;
            case 1:
                result.value = this._buffer.slice(this._offset, this._offset + length).toString('utf8');
                break;
            default:
                result.value = this._buffer.slice(this._offset, this._offset + length).toString('utf8');
                break;
        }
        this._offset += length;
        return result;
    }

    public crop(): Buffer {
        return this._buffer.slice(this._offset, this._buffer.length);
    }

}
