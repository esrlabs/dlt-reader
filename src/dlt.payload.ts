import Header, { Standard, Extended } from './dlt.header';
import PayloadNonVerbose from './dlt.payload.nonverbose';
import PayloadVerbose, { IArgumentValue } from './dlt.payload.verbose';
import { DLTError, EErrorCode } from './dlt.error';

export enum EMode {
    VERBOSE = 'VERBOSE',
    NON_VERBOSE = 'NON_VERBOSE',
}

export interface IPayloadData {
    mode: EMode;
    content: IArgumentValue[];
}

export default class Payload {

    public mode: EMode = EMode.NON_VERBOSE;

    private _buffer: Buffer;
    private _header: Header;
    private _processor: PayloadNonVerbose | PayloadVerbose;

    constructor(buffer: Buffer, header: Header) {
        this._buffer = buffer;
        this._header = header;
        const MSBF: boolean = (this._header.standard as Standard.Header).MSBF;
        if (this._header.extended === undefined || !this._header.extended.VERB) {
            this.mode = EMode.NON_VERBOSE;
            this._processor = new PayloadNonVerbose(this._buffer, MSBF);
        } else {
            this.mode = EMode.VERBOSE;
            this._processor = new PayloadVerbose(this._buffer, this._header.extended.NOAR, MSBF);
        }
    }

    public read(includeStrValue: boolean = false): IPayloadData | DLTError {
        const payload: any = this._processor.read(includeStrValue);
        if (payload instanceof DLTError) {
            return payload;
        }
        return {
            mode: this.mode,
            content: payload,
        };
    }

}
