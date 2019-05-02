import * as Stream from 'stream';

export default class NullWritableStream extends Stream.Writable {

    private _print: boolean = false;

    constructor(print?: boolean) {
        super({});
        if (typeof print === 'boolean') {
            this._print = print;
        }
    }

    public _write(chunk: Buffer | string, encoding: string, callback: () => any) {
        if (this._print) {
            console.log(chunk.toString());
        }
        callback();
    }

}
