export enum EErrorCode {
    HEADER_MIN_LEN = 'HEADER_MIN_LEN',
    NO_DLT_PATTERN = 'NO_DLT_PATTERN',
    PACKET_LEN = 'PACKET_LEN',
    TYPE_INFO_LEN = 'TYPE_INFO_LEN',
    NOT_ALL_ARGS_PARSED = 'NOT_ALL_ARGS_PARSED',
    NO_ARGUMENT_PROCESSOR = 'NO_ARGUMENT_PROCESSOR',
    PAYLOAD_LEN = 'PAYLOAD_LEN',
    UNKNOWN = 'UNKNOWN',
}

export class DLTError extends Error {

    public code: EErrorCode | undefined;

    constructor(message?: string, code?: EErrorCode) {
        super(message);
        this.code = code;
    }

}
