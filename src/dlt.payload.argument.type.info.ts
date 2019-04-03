import { Buffer } from 'buffer';
import * as PayloadConsts from './dlt.payload.arguments.consts';
import { ABufferReader } from './interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from './dlt.error';

export default class PayloadArgumentTypeInfo extends ABufferReader {

    public TYLE: boolean = false;
    public BOOL: boolean = false;
    public SINT: boolean = false;
    public UINT: boolean = false;
    public FLOA: boolean = false;
    public ARAY: boolean = false;
    public STRG: boolean = false;
    public RAWD: boolean = false;
    public VARI: boolean = false;
    public FIXP: boolean = false;
    public TRAI: boolean = false;
    public STRU: boolean = false;
    public SCOD: boolean = false;

    public TYLEValue: number = 0;
    public SCODValue: number | undefined;

    public type: PayloadConsts.EType = PayloadConsts.EType.UNDEFINED;

    private _value: number = 0;

    constructor(buffer: Buffer, MSBF: boolean) {
        super(buffer, MSBF);
    }

    public read(): DLTError | undefined {
        // Check length
        if (this._buffer.length < 4) {
            return new DLTError(`Length of buffer small as required to read TypeInfo. Length of buffer: ${this._buffer.length}; required: 4.`, EErrorCode.TYPE_INFO_LEN);
        }
        this._value = this.readUInt32();
        this.TYLE = (this._value & PayloadConsts.Flags.TYLE) !== 0;
        this.BOOL = (this._value & PayloadConsts.Flags.BOOL) !== 0;
        this.SINT = (this._value & PayloadConsts.Flags.SINT) !== 0;
        this.UINT = (this._value & PayloadConsts.Flags.UINT) !== 0;
        this.FLOA = (this._value & PayloadConsts.Flags.FLOA) !== 0;
        this.ARAY = (this._value & PayloadConsts.Flags.ARAY) !== 0;
        this.STRG = (this._value & PayloadConsts.Flags.STRG) !== 0;
        this.RAWD = (this._value & PayloadConsts.Flags.RAWD) !== 0;
        this.VARI = (this._value & PayloadConsts.Flags.VARI) !== 0;
        this.FIXP = (this._value & PayloadConsts.Flags.FIXP) !== 0;
        this.TRAI = (this._value & PayloadConsts.Flags.TRAI) !== 0;
        this.STRU = (this._value & PayloadConsts.Flags.STRU) !== 0;
        this.SCOD = (this._value & PayloadConsts.Flags.SCOD) !== 0;

        this.TYLEValue = (this._value & PayloadConsts.Masks.TYLE);
        this.SCODValue = this.SCOD ? (this._value & PayloadConsts.Masks.SCOD) : undefined;

        [   PayloadConsts.EType.BOOL, PayloadConsts.EType.SINT, PayloadConsts.EType.UINT,
            PayloadConsts.EType.FLOA, PayloadConsts.EType.ARAY, PayloadConsts.EType.STRG,
            PayloadConsts.EType.RAWD, PayloadConsts.EType.TRAI, PayloadConsts.EType.STRU].forEach((alias) => {
            if ((this as any)[alias]) {
                this.type = PayloadConsts.EType[alias];
            }
        });
    }

}
