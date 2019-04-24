import { Buffer } from 'buffer';
import { ABufferReader } from './interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from './dlt.error';

export const Parameters = {
    MIN_LEN: 10,
    MAX_LEN: 10,
};

export const HeaderExtendedFlags = {
    VERB: 0b00000001,
};

export const HeaderExtendedMasks = {
    MSTP: 0b00001110,
    MTIN: 0b11110000,
};

export enum EMSTP {
    DLT_TYPE_LOG        = 'DLT_TYPE_LOG',
    DLT_TYPE_APP_TRACE  = 'DLT_TYPE_APP_TRACE',
    DLT_TYPE_NW_TRACE   = 'DLT_TYPE_NW_TRACE',
    DLT_TYPE_CONTROL    = 'DLT_TYPE_CONTROL',
    // Default
    UNDEFINED           = 'UNDEFINED',
}

export enum EMSTPShort {
    DLT_TYPE_LOG        = 'LOG',
    DLT_TYPE_APP_TRACE  = 'APP_TRACE',
    DLT_TYPE_NW_TRACE   = 'NW_TRACE',
    DLT_TYPE_CONTROL    = 'CONTROL',
    // Default
    UNDEFINED           = 'UNDEFINED',
}

const MSTPMap: { [key: number]: EMSTP } = {
    0x00: EMSTP.DLT_TYPE_LOG,
    0x01: EMSTP.DLT_TYPE_APP_TRACE,
    0x02: EMSTP.DLT_TYPE_NW_TRACE,
    0x03: EMSTP.DLT_TYPE_CONTROL,
};

export enum EMTIN {
    // If MSTP == DLT_TYPE_LOG
    DLT_LOG_FATAL           = 'DLT_LOG_FATAL',
    DLT_LOG_ERROR           = 'DLT_LOG_ERROR',
    DLT_LOG_WARN            = 'DLT_LOG_WARN',
    DLT_LOG_INFO            = 'DLT_LOG_INFO',
    DLT_LOG_DEBUG           = 'DLT_LOG_DEBUG',
    DLT_LOG_VERBOSE         = 'DLT_LOG_VERBOSE',
    // If MSTP == DLT_TYPE_APP_TRACE
    DLT_TRACE_VARIABLE      = 'DLT_TRACE_VARIABLE',
    DLT_TRACE_FUNCTION_IN   = 'DLT_TRACE_FUNCTION_IN',
    DLT_TRACE_FUNCTION_OUT  = 'DLT_TRACE_FUNCTION_OUT',
    DLT_TRACE_STATE         = 'DLT_TRACE_STATE',
    DLT_TRACE_VFB           = 'DLT_TRACE_VFB',
    // If MSTP == DLT_TYPE_NW_TRACE
    DLT_NW_TRACE_IPC        = 'DLT_NW_TRACE_IPC',
    DLT_NW_TRACE_CAN        = 'DLT_NW_TRACE_CAN',
    DLT_NW_TRACE_FLEXRAY    = 'DLT_NW_TRACE_FLEXRAY',
    DLT_NW_TRACE_MOST       = 'DLT_NW_TRACE_MOST',
    // If MSTP == DLT_TYPE_CONTROL
    DLT_CONTROL_REQUEST     = 'DLT_CONTROL_REQUEST',
    DLT_CONTROL_RESPONSE    = 'DLT_CONTROL_RESPONSE',
    DLT_CONTROL_TIME        = 'DLT_CONTROL_TIME',
    // Default
    UNDEFINED               = 'UNDEFINED',
}

export enum EMTINShort {
    // If MSTP == DLT_TYPE_LOG
    DLT_LOG_FATAL           = 'FATAL',
    DLT_LOG_ERROR           = 'ERROR',
    DLT_LOG_WARN            = 'WARN',
    DLT_LOG_INFO            = 'INFO',
    DLT_LOG_DEBUG           = 'DEBUG',
    DLT_LOG_VERBOSE         = 'VERBOSE',
    // If MSTP == DLT_TYPE_APP_TRACE
    DLT_TRACE_VARIABLE      = 'VARIABLE',
    DLT_TRACE_FUNCTION_IN   = 'FUNCTION_IN',
    DLT_TRACE_FUNCTION_OUT  = 'FUNCTION_OUT',
    DLT_TRACE_STATE         = 'STATE',
    DLT_TRACE_VFB           = 'VFB',
    // If MSTP == DLT_TYPE_NW_TRACE
    DLT_NW_TRACE_IPC        = 'IPC',
    DLT_NW_TRACE_CAN        = 'CAN',
    DLT_NW_TRACE_FLEXRAY    = 'FLEXRAY',
    DLT_NW_TRACE_MOST       = 'MOST',
    // If MSTP == DLT_TYPE_CONTROL
    DLT_CONTROL_REQUEST     = 'REQUEST',
    DLT_CONTROL_RESPONSE    = 'RESPONSE',
    DLT_CONTROL_TIME        = 'TIME',
    // Default
    UNDEFINED               = 'UNDEFINED',
}

const MTINMap: { [key: string]: { [key: number]: EMTIN } } = {
    [EMSTP.DLT_TYPE_LOG]: {
        0x01: EMTIN.DLT_LOG_FATAL,
        0x02: EMTIN.DLT_LOG_ERROR,
        0x03: EMTIN.DLT_LOG_WARN,
        0x04: EMTIN.DLT_LOG_INFO,
        0x05: EMTIN.DLT_LOG_DEBUG,
        0x06: EMTIN.DLT_LOG_VERBOSE,
    },
    [EMSTP.DLT_TYPE_APP_TRACE]: {
        0x01: EMTIN.DLT_TRACE_VARIABLE,
        0x02: EMTIN.DLT_TRACE_FUNCTION_IN,
        0x03: EMTIN.DLT_TRACE_FUNCTION_OUT,
        0x04: EMTIN.DLT_TRACE_STATE,
        0x05: EMTIN.DLT_TRACE_VFB,
    },
    [EMSTP.DLT_TYPE_NW_TRACE]: {
        0x01: EMTIN.DLT_NW_TRACE_IPC,
        0x02: EMTIN.DLT_NW_TRACE_CAN,
        0x03: EMTIN.DLT_NW_TRACE_FLEXRAY,
        0x04: EMTIN.DLT_NW_TRACE_MOST,
    },
    [EMSTP.DLT_TYPE_CONTROL]: {
        0x01: EMTIN.DLT_CONTROL_REQUEST,
        0x02: EMTIN.DLT_CONTROL_RESPONSE,
        0x03: EMTIN.DLT_CONTROL_TIME,
    },
};

export interface IToStringOptions {
    MSIN?: boolean;
    VERB?: boolean;
    MSTP?: boolean;
    MTIN?: boolean;
    NOAR?: boolean;
    APID?: boolean;
    CTID?: boolean;
}

export class Header extends ABufferReader {

    public MSIN: number = -1;               // Message Info
    public VERB: boolean = false;           // Verbose
    public MSTP: EMSTP = EMSTP.UNDEFINED;   // Message Type
    public MTIN: EMTIN = EMTIN.UNDEFINED;   // Message Type Info
    public NOAR: number = -1;               // Number of arguments
    public APID: string = '';               // Application ID
    public CTID: string = '';               // Context ID

    constructor(buffer: Buffer) {
        super(buffer, true);
    }

    public read(): DLTError | undefined {
        // Check minimal size
        if (this._buffer.length < Parameters.MIN_LEN) {
            return new DLTError(`Minimal length of extended header is ${Parameters.MIN_LEN} bytes, but size of buffer is ${this._buffer.length} bytes.`, EErrorCode.HEADER_MIN_LEN);
        }
        // Reading
        this.MSIN = this.readUInt8();
        this.VERB = (this.MSIN & HeaderExtendedFlags.VERB) !== 0;
        const MSTPValue: number = (this.MSIN & HeaderExtendedMasks.MSTP) >> 1;
        if (MSTPMap[MSTPValue] !== undefined) {
            this.MSTP = MSTPMap[MSTPValue];
        }
        const MTINRelatedMap: { [key: number]: EMTIN } = MTINMap[this.MSTP];
        if (MTINRelatedMap !== undefined) {
            const MTINValue: number  = (this.MSIN & HeaderExtendedMasks.MTIN) >> 4;
            if (MTINRelatedMap[MTINValue] !== undefined) {
                this.MTIN = MTINRelatedMap[MTINValue];
            }
        }
        this.NOAR = this.readUInt8();
        this.APID = this._buffer.slice(this._offset, this._offset + 4).toString('ascii');
        this._offset += 4;
        this.CTID = this._buffer.slice(this._offset, this._offset + 4).toString('ascii');
        this._offset += 4;
    }

    public getOffset(): number {
        return this._offset;
    }

    public toString(delimiter: string = ' ', options?: IToStringOptions): string {
        options = options === undefined ? {
            MSIN: false,
            VERB: false,
            MSTP: true,
            MTIN: true,
            NOAR: true,
            APID: true,
            CTID: true,
        } : options;
        let str: string = '';
        let count: number = 0;
        Object.keys(options).forEach((key: string) => {
            if (!(options as any)[key] || (this as any)[key] === undefined) {
                return;
            }
            const value: any = (this as any)[key];
            if (key === 'MSTP' && EMSTPShort[value] !== undefined) {
                str += `${count > 0 ? delimiter : ''}${EMSTPShort[value]}`;
            } else if (key === 'MTIN' && EMTINShort[value] !== undefined) {
                str += `${count > 0 ? delimiter : ''}${EMTINShort[value]}`;
            } else {
                str += `${count > 0 ? delimiter : ''}${value === undefined ? '' : value}`;
            }
            count += 1;
        });
        return str;
    }
}
