import { Buffer } from 'buffer';
import * as PayloadConsts from '../dlt.payload.arguments.consts';
import TypeInfo from '../dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from '../interfaces/interface.dlt.payload.argument.type.processor';

export interface IData {
    value: number;
    name: string | undefined;
    unit: string | undefined;
}

interface IPointData {
    quantization: number | undefined;
    offset: number | undefined;
    bufferOffset: number;
}

export default class UINT extends APayloadTypeProcessor<IData> {

    constructor(buffer: Buffer, info: TypeInfo, MSBF: boolean) {
        super(buffer, info, MSBF);
    }

    public read(): IData | Error {
        const result: IData = { name: undefined, unit: undefined, value: 0 };
        const names: { name: string | undefined, unit: string | undefined } = this._getName();
        const point: IPointData = this._getPoint();
        result.name = names.name;
        result.unit = names.unit;
        if (point. quantization !== undefined) {
            // TODO: implementation for this case
            // return result;
        }
        let byteCount: number = 1;
        switch (this._info.TYLEValue) {
            case 1: byteCount = 1; break;
            case 2: byteCount = 2; break;
            case 3: byteCount = 4; break;
            case 4: byteCount = 8; break;
            case 5: byteCount = 16; break;
        }
        result.value = this.readInt(byteCount);
        return result;
    }

    public crop(): Buffer {
        return this._buffer.slice(this._offset, this._buffer.length);
    }

    private _getName(): { name: string | undefined, unit: string | undefined } {
        const name = { length: 0, value: '' };
        const unit = { length: 0, value: '' };
        if (!this._info.VARI) {
            return { name: undefined, unit: undefined };
        }
        name.length = this.readUInt16();
        unit.length = this.readUInt16();
        name.value = this._buffer.slice(this._offset, this._offset + name.length).toString('ascii');
        this._offset += name.length;
        unit.value = this._buffer.slice(this._offset, this._offset + unit.length).toString('ascii');
        this._offset += unit.length;
        return {
            name: name.value,
            unit: unit.value,
        };
    }

    private _getPoint(): IPointData {
        const result: IPointData = { quantization: undefined, offset: undefined, bufferOffset: 0 };
        if (!this._info.FIXP) {
            return result;
        }
        result.quantization = this.readFloat();
        switch (this._info.TYLEValue) {
            case 1:
            case 2:
            case 3:
                result.offset = this.readUInt(4);
                break;
            case 4:
                result.offset = this.readUInt(8);
                break;
            case 5:
                result.offset = this.readUInt(16);
                break;
        }
        return result;
    }

}
