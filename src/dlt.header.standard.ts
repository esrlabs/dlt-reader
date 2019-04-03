import { Buffer } from 'buffer';
import { ABufferReader } from './interfaces/interface.dlt.payload.argument.type.processor';
import { DLTError, EErrorCode } from './dlt.error';

export const Parameters = {
    MIN_LEN: 4,
    MAX_LEN: 16,
};

export const HeaderStandardFlags = {
    UEH : 0b00000001,
    MSBF: 0b00000010,
    WEID: 0b00000100,
    WSID: 0b00001000,
    WTMS: 0b00010000,
};

export const HeaderStandardMasks = {
    VERS: 0b11100000,
};

/**
 * @class Header
 * @classdesc StandardHeader
 * @property {boolean}  UEH     - Has Extended Header
 * @property {boolean}  MSBF    - MSB First: true - payload BE; false - payload LE
 * @property {boolean}  WEID    - Has ECU ID
 * @property {boolean}  WSID    - Has Session ID
 * @property {boolean}  WTMS    - Has Timestamp
 * @property {number}   VERS    - Version Number
 * @property {number}   MCNT    - Message Counter
 * @property {number}   LEN     - Length of the complete message in bytes
 * @property {number}   SID     - Session ID
 * @property {number}   TMS     - Timestamp
 * @property {string}   EID     - ECU ID (ECU)
 */
export class Header extends ABufferReader {

    public UEH:     boolean = false;  // Use Extended Header
    public MSBF:    boolean = false;  // MSB First: true - payload BE; false - payload LE
    public WEID:    boolean = false;  // With ECU ID
    public WSID:    boolean = false;  // With Session ID
    public WTMS:    boolean = false;  // With Timestamp
    public VERS:    number = -1;      // Version Number
    public MCNT:    number = -1;      // Message Counter
    public LEN:     number = -1;      // Length of the complete message in bytes
    public EID:     string = '';      // ECU ID (ECU)
    public SID:     number = -1;      // Session ID
    public TMS:     number = -1;      // Timestamp

    constructor(buffer: Buffer) {
        super(buffer, true);
    }

    public read(): DLTError | undefined {
        if (this._buffer.length < Parameters.MIN_LEN) {
            return new DLTError(`Minimal length of standard header is ${Parameters.MIN_LEN} bytes, but size of buffer is ${this._buffer.length} bytes.`, EErrorCode.HEADER_MIN_LEN);
        }
        const content = this.readUInt8();
        // Check structure of header: what header includes
        ['UEH', 'MSBF', 'WEID', 'WSID', 'WTMS'].forEach((key: string) => {
            (this as any)[key] = (content & (HeaderStandardFlags as any)[key]) !== 0;
        });
        // Get version of protocol
        this.VERS = (content & HeaderStandardMasks.VERS) >> 5;
        // Get message counter
        this.MCNT = this.readUInt8();
        // Get length
        this.LEN = this.readUInt16();
        // Check length of whole packet
        if (this._buffer.length < this.LEN) {
            return new DLTError(`Expected size of header is bigger than buffer. Some of parameters are defiend (WEID, WSID, WTMS), but no data in buffer.`, EErrorCode.PACKET_LEN);
        }
        // Check ECU ID (WEID)
        if (this.WEID) {
            this.EID = this._buffer.slice(this._offset, this._offset + 4).toString('ascii');
            this._offset += 4;
        }
        // Check session Id (WSID)
        if (this.WSID) {
            this.SID = this.readUInt32();
        }
        // Check timestamp (WTMS)
        if (this.WTMS) {
            this.TMS = this.readUInt32();
        }
    }

    public getOffset(): number {
        return this._offset;
    }

}
