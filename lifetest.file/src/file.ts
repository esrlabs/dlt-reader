
import * as DLT from '../../src/index';
import * as fs from 'fs';

const started: number = Date.now();

const file: string = '/Users/dmitry.astafyev/WebstormProjects/logviewer/logs_examples/DTC_SP21.dlt';

const tranform: DLT.TransformStream = new DLT.TransformStream({}, { stringify: true, columnsDelimiter: '|', argumentsDelimiter: '!' });
const writer: DLT.NullWritableStream = new DLT.NullWritableStream(true);
const reader: fs.ReadStream = fs.createReadStream(file);

tranform.on(DLT.TransformStream.Events.chunk, (bytes, packets) => {
    console.log(`Has beed read: ${(bytes / 1024 / 1024).toFixed(2)}Mb; detected ${packets} packets`);
});

reader.on('end', () => {
    console.log(`DONE IN: ${((Date.now() - started) / 1000).toFixed(2)}s`);
});

reader.pipe(tranform).pipe(writer, { end: false });
