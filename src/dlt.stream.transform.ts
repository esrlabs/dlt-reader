import { Transform, TransformOptions, TransformCallback } from 'stream';
import { Header, ITimestamp } from './dlt.header.front';
import { DLTError, EErrorCode } from './dlt.error';
import { EMTIN } from './dlt.header.extended';
import Packet, { IPacketData, EColumn } from './dlt.packet';

export interface IStoredPacket {
    packet: IPacketData;
    timestamp: ITimestamp;
    EDUID: string;
    str?: string;
}

export type TConvertorFunc = (packets: IStoredPacket[]) => Buffer | string;

export interface IOptions {
    stopOnError?: boolean;
    stringify?: boolean;
    columns?: EColumn[];
    columnsDelimiter?: string;
    argumentsDelimiter?: string;
    MTIN?: EMTIN[];
    convertor?: TConvertorFunc | undefined;
}

export default class DLTFileReadStream extends Transform {

    public static Events = {
        packet: 'packet',
        chunk: 'chunk',
        error: 'error',
    };

    private _buffer: Buffer = new Buffer(0);
    private _header: Header | undefined;
    private _packets: number = 0;
    private _bytes: number = 0;
    private _options: IOptions = {
        stopOnError: false,
        stringify: false,
        columnsDelimiter: ' ',
        argumentsDelimiter: ' ',
        columns: [
            EColumn.DATETIME,
            EColumn.ECUID,
            EColumn.VERS,
            EColumn.SID,
            EColumn.MCNT,
            EColumn.TMS,
            EColumn.EID,
            EColumn.MSIN,
            EColumn.VERB,
            EColumn.MSTP,
            EColumn.MTIN,
            EColumn.NOAR,
            EColumn.APID,
            EColumn.CTID,
            EColumn.PAYLOAD,
        ],
        MTIN: [
            EMTIN.DLT_LOG_FATAL,
            EMTIN.DLT_LOG_ERROR,
            EMTIN.DLT_LOG_WARN,
            EMTIN.DLT_LOG_INFO,
            EMTIN.DLT_LOG_DEBUG,
            EMTIN.DLT_LOG_VERBOSE,
            EMTIN.DLT_TRACE_VARIABLE,
            EMTIN.DLT_TRACE_FUNCTION_IN,
            EMTIN.DLT_TRACE_FUNCTION_OUT,
            EMTIN.DLT_TRACE_STATE,
            EMTIN.DLT_TRACE_VFB,
            EMTIN.DLT_NW_TRACE_IPC,
            EMTIN.DLT_NW_TRACE_CAN,
            EMTIN.DLT_NW_TRACE_FLEXRAY,
            EMTIN.DLT_NW_TRACE_MOST,
            EMTIN.DLT_CONTROL_REQUEST,
            EMTIN.DLT_CONTROL_RESPONSE,
            EMTIN.DLT_CONTROL_TIME,
            EMTIN.UNDEFINED,
        ],
        convertor: undefined,
    };

    constructor(transformOptions: TransformOptions | undefined, readerOption?: IOptions) {
        super(transformOptions);
        if (readerOption !== undefined && readerOption !== null) {
            if (readerOption.columns !== undefined && !(readerOption.columns instanceof Array)) {
                throw new Error(`columns should be defined as Array<EColumn>.`);
            }
            if (readerOption.MTIN !== undefined && !(readerOption.MTIN instanceof Array)) {
                throw new Error(`MTIN should be defined as Array<MTIN>.`);
            }
            Object.assign(this._options, readerOption);
        }
    }

    public _transform(buffer: Buffer, encoding: string, callback: TransformCallback) {
        let output: string = '';
        this._buffer = Buffer.concat([this._buffer, buffer]);
        this._bytes += buffer.length;
        let packet: DLTError | IStoredPacket | undefined | null;
        const packets: IStoredPacket[] = [];
        do {
            packet = this._readChunk();
            if (packet instanceof DLTError) {
                // Error during parsing
                this.emit(DLTFileReadStream.Events.error, packet);
                if (this._options.stopOnError) {
                    // Stop on error
                    callback(new Error(`${packet.code}: ${packet.message}`), undefined);
                    return;
                }
                break;
            }
            if (packet === undefined) {
                // Buffer size doesn't have "body" of message
                break;
            }
            if (packet === null) {
                // Packet is out of filter
            } else {
                // Trigger event for new packet
                this.emit(DLTFileReadStream.Events.packet, packet);
                if (this._options.stringify) {
                    output += `${packet.str}\n`;
                }
                if (this._options.convertor !== undefined) {
                    packets.push(packet);
                }
            }
            this._packets += 1;
            if (this._buffer.length === 0) {
                // Buffer is read completely
                break;
            }
        } while (true);
        // Trigger chunk event
        this.emit(DLTFileReadStream.Events.chunk, this._bytes, this._packets);
        // Callback
        if (this._options.convertor !== undefined) {
            callback(undefined, this._options.convertor(packets));
        } else if (this._options.stringify) {
            callback(undefined, output);
        } else {
            callback(undefined, buffer);
        }
    }

    private _readChunk(): DLTError | IStoredPacket | undefined | null {
        // Check minimal length
        if (this._buffer.length < Header.getRequiredLength() && this._header === undefined) {
            // Wait for more data
            return undefined;
        }
        // Extract front header
        if (this._header === undefined) {
            this._header = new Header(this._buffer);
            const readHeaderResult: DLTError | undefined = this._header.read();
            if (readHeaderResult instanceof DLTError) {
                this._header = undefined;
                return readHeaderResult;
            }
            // Crop buffer
            this._buffer = this._header.crop();
        }
        // Try to read packet
        if (!Packet.canBeParsed(this._buffer)) {
            return undefined;
        }
        const processor: Packet = new Packet(this._buffer);
        const packet: IPacketData | DLTError = processor.read(true);
        if (packet instanceof DLTError) {
            return packet;
        }
        if (!this._isFiltered(packet)) {
            // Remove already read message from buffer
            this._buffer = processor.crop();
            // Drop header
            this._header = undefined;
            return null;
        }
        let str: string | undefined;
        if (this._options.stringify) {
            str = (this._options.columns as EColumn[]).map((column: EColumn) => {
                return this._getColumnStrData(column, this._header, packet);
            }).join(this._options.columnsDelimiter);
        }
        const result = { packet: packet, timestamp: this._header.timestamp, EDUID: this._header.ECUID, str: str };
        // Remove already read message from buffer
        this._buffer = processor.crop();
        // Drop header
        this._header = undefined;
        return result;
    }

    private _isFiltered(packet: IPacketData): boolean {
        if (packet.extendedHeader === undefined) {
            return true;
        }
        return (this._options.MTIN as EMTIN[]).indexOf(packet.extendedHeader.MTIN) !== -1;
    }

    private _getColumnStrData(column: EColumn, header: Header | undefined, packet: IPacketData): string {
        switch (column) {
            case EColumn.DATETIME:
                if (header === undefined) {
                    return '';
                }
                return this._getDatetime(header.timestamp.unixstamp);
            case EColumn.ECUID:
                if (header === undefined) {
                    return '';
                }
                return header.ECUID;
            case EColumn.UEH:
            case EColumn.MSBF:
            case EColumn.WEID:
            case EColumn.WSID:
            case EColumn.WTMS:
            case EColumn.VERS:
            case EColumn.MCNT:
            case EColumn.LEN:
            case EColumn.SID:
            case EColumn.TMS:
            case EColumn.UEH:
            case EColumn.EID:
                if (packet.standardHeader === undefined) {
                    return '';
                }
                return packet.standardHeader.getPropAsStr(column);
            case EColumn.MSIN:
            case EColumn.VERB:
            case EColumn.MSTP:
            case EColumn.MTIN:
            case EColumn.NOAR:
            case EColumn.APID:
            case EColumn.CTID:
                if (packet.extendedHeader === undefined) {
                    return '';
                }
                return packet.extendedHeader.getPropAsStr(column);
            case EColumn.PAYLOAD:
                if (packet.payload === undefined || !(packet.payload.content instanceof Array)) {
                    return '';
                }
                return packet.payload.content.map((value) => {
                    return value.str;
                }).join(this._getArgumentsDelimiter());
            default:
                return '';
        }
    }

    private _getDatetime(unixstamp: number): string {
        if (this._options.columns === undefined || this._options.columns.indexOf(EColumn.DATETIME) !== -1) {
            const date: Date = new Date(unixstamp);
            return this._isDateValid(date) ? `${date.toISOString()}` : `${unixstamp}`;
        } else {
            return `${unixstamp}`;
        }
    }

    private _isDateValid(date: Date): boolean {
        return date instanceof Date && !isNaN(date.getTime());
    }

    private _getArgumentsDelimiter(): string {
        return this._options.argumentsDelimiter === undefined ? ' ' : this._options.argumentsDelimiter;
    }

}
