import * as PayloadConsts from './dlt.payload.arguments.consts';
import TypeInfo from './dlt.payload.argument.type.info';
import { APayloadTypeProcessor } from './interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from './dlt.error';

import BOOL from './types/dlt.payload.argument.type.BOOL';
import FLOA from './types/dlt.payload.argument.type.FLOA';
import UINT from './types/dlt.payload.argument.type.UINT';
import SINT from './types/dlt.payload.argument.type.SINT';
import STRG from './types/dlt.payload.argument.type.STRG';
import STRU from './types/dlt.payload.argument.type.STRU';
import TRAI from './types/dlt.payload.argument.type.TRAI';
import RAWD from './types/dlt.payload.argument.type.RAWD';

const Processors: { [key: string]: any } = {
    BOOL: BOOL,
    FLOA: FLOA,
    UINT: UINT,
    SINT: SINT,
    STRG: STRG,
    STRU: STRU,
    TRAI: TRAI,
    RAWD: RAWD,
};

export const EType = PayloadConsts.EType;

export interface IArgumentData {
    type: PayloadConsts.EType;
    data: any;
    str?: string;
    cropped: Buffer;
}

export default class PayloadArgument {

    public value: any;

    private _buffer: Buffer;
    private _info: TypeInfo | undefined;
    private _offset: number = 0;
    private _MSBF: boolean; // MSB First: true - payload BE; false - payload LE
    private _processor: APayloadTypeProcessor<any> | undefined;

    constructor(buffer: Buffer, MSBF: boolean) {
        this._buffer = buffer;
        this._MSBF = MSBF;
    }

    public read(includeStrValue: boolean = false): IArgumentData | DLTError {
        // Get type info
        this._info = new TypeInfo(this._buffer, this._MSBF);
        const readTypeInfoError: DLTError | undefined = this._info.read();
        if (readTypeInfoError instanceof DLTError) {
            return readTypeInfoError;
        }
        this._offset += 4;
        // Get value
        const buffer: Buffer = this._buffer.slice(this._offset, this._buffer.length);
        // Looking for relevant processor
        if (Processors[this._info.type] === undefined) {
            return new DLTError(`Cannot find processor for type "${this._info.type}".`, EErrorCode.NO_ARGUMENT_PROCESSOR);
        }
        // Create processor
        this._processor = new Processors[this._info.type](buffer, this._info, this._MSBF) as APayloadTypeProcessor<any>;
        // Read data
        const data: any = this._processor.read();
        if (data instanceof DLTError) {
            return data;
        }
        const results: IArgumentData = {
            type: this._info.type,
            data: data,
            cropped: this._processor.crop(),
        };
        if (includeStrValue) {
            results.str = this._processor.toString();
        }
        this._processor = undefined;
        return results;
    }

}
