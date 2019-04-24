import PayloadArgument, { IArgumentData } from './dlt.payload.argument';
import * as PayloadConsts from './dlt.payload.arguments.consts';
import { DLTError, EErrorCode } from './dlt.error';

export interface IArgumentValue {
    type: PayloadConsts.EType;
    data: any;
    str?: string;
}

export default class PayloadVerbose {

    private _buffer: Buffer;
    private _NOAR: number;
    private _MSBF: boolean; // MSB First: true - payload BE; false - payload LE

    constructor(buffer: Buffer, NOAR: number, MSBF: boolean) {
        this._buffer = buffer;
        this._NOAR = NOAR; // Count of expected arguments
        this._MSBF = MSBF;
    }

    public read(includeStrValue: boolean = false): IArgumentValue[] | DLTError {
        // Calculate minimal size of buffer. Size of TypeInfo is 4 bytes; TypeInfo should be presend for each argument
        const minSize: number = 4 * this._NOAR;
        // Check length of buffer
        if (this._buffer.length < minSize) {
            return new DLTError(`NOAR is ${this._NOAR}, but size of buffer is ${this._buffer.length} bytes. Minimal size requered: ${minSize} bytes.`, EErrorCode.PAYLOAD_LEN);
        }
        const result: IArgumentValue[] = [];
        if (this._buffer.length === 0 || this._NOAR === 0) {
            return result;
        }
        do {
            const argument: PayloadArgument = new PayloadArgument(this._buffer, this._MSBF);
            const data: IArgumentData | DLTError = argument.read(includeStrValue);
            if (data instanceof DLTError) {
                return data;
            }
            this._buffer = data.cropped;
            const res: IArgumentValue = {
                type: data.type,
                data: data.data,
            };
            if (includeStrValue) {
                res.str = data.str;
            }
            result.push(res);
        } while (this._buffer.length > 0 || result.length < this._NOAR);
        return result;
    }

}
