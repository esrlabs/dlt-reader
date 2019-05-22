# Overview
This library helps decode DLT logs (Diagnostic Log and Trace):
* from stream (being connected to DLT demon)
* from file

# Installation
```
npm install dltreader --save
```

# Usage
## Decode file

Example of file reading.

```typescript
import * as DLT from 'dltreader';
import * as fs from 'fs';

const file: string = 'some_logs_file.dlt';

// Create transform object
// Bellow see more about options for DLT transform object
const tranform : DLT.TransformStream = new DLT.TransformStream({}, { stringify: true, datetime: true });

// Create null writable stream (we do not want in this example to write any data, it's just reading.
// If you need write data, just create real writable stream
const writer: DLT.NullWritableStream = new DLT.NullWritableStream(true);

// Or real sctream
/*
const writer: fs.WriteStream = fs.createWriteStream('some_desination_file.txt');
*/

// Create file reader (for original DLT file)
const reader: fs.ReadStream = fs.createReadStream(file);

// This event is triggered: when chunk is read and decoded
tranform.on(DLT.TransformStream.Events.chunk, (bytes, packets) => {
    console.log(`Has beed read: ${(bytes / 1024 / 1024).toFixed(2)}Mb; detected ${packets} packets`);
});

// Listen moment of complite to read file
reader.on('end', () => {
    console.log(`Done`);
});

// Start reading
reader.pipe(tranform).pipe(writer, { end: false });
```

## Run-time decode stream

Example of reading DLT-demon
```typescript
import * as Net from 'net';
import * as DLT from 'dltreader';

const DLT_DEMON_IP = '127.0.0.1';
const DLT_DEMON_PORT = 3490;


// Create DLT buffer
const dltbuffer = new DLT.Buffer();

// Create object to count incoming packages
const counters = {
    packets: 0,
    pending: 0,
    size: 0,
    errors: 0,
};

// Array to store errors
const errors: string[] = [];

// "packet" event triggers with each decoded package
dltbuffer.on(DLT.Buffer.Events.packet, (packet: DLT.IPacketData) => {
    counters.size += packet.length;
    console.log(`Packet: ${packet.length} bytes;\tWSID: ${packet.standardHeader.WSID};\tWTMS: ${packet.standardHeader.WTMS};\tWEID: ${packet.standardHeader.WEID};\tEID: ${packet.standardHeader.EID};\tMCNT: ${packet.standardHeader.MCNT}`);
    console.log(`Packages read: ${++counters.packets}; ${counters.size} bytes; errors: ${counters.errors}`, 'done');
});

// "error" event triggers if decoding of package was failed. Process of listening / decoding isn't stopped
dltbuffer.on(DLT.Buffer.Events.error, (error: DLT.Error) => {
    if (error.code !== DLT.EErrorCode.HEADER_MIN_LEN && error.code !== DLT.EErrorCode.PACKET_LEN) {
        errors.push(`Error: ${error.message}. Code: ${error.code}.`);
        console.log(`${errors.join('\n')}`, 'errors');
        counters.errors += 1;
    } else {
        console.log(`Packages pendin happens: ${++counters.pending}`, 'pendins');
    }
});

// Create connection to DLT demon
const socket: Net.Socket = Net.connect(DLT_DEMON_PORT, DLT_DEMON_IP, () => {
	console.log('Connected to DLT daemon.');
});

// Start listening connection
socket.on('data', (chunk: Buffer) => {
	dltbuffer.add(chunk);
});

// Listen errors of connection
socket.on('error', (error: Error) => {
	console.error(`Connection error: ${error.message}`);
});

// Do not forget to close application with closing of connection
socket.on('close', () => {
	process.exit();
});
```