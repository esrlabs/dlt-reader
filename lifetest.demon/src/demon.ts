
import * as Net from 'net';
import * as DLT from '../../src/index';
import { StdoutController } from 'custom.stdout';

const DLT_DEMON_IP = '172.16.224.128';
const DLT_DEMON_PORT = 3490;

const stdout: StdoutController = new StdoutController(process.stdout);

// Create DLT buffer
const dltbuffer = new DLT.Buffer();
const counters = {
    packets: 0,
    pending: 0,
    size: 0,
    errors: 0,
};

const stat: any = {
    BOOL: 0,
    FLOA: 0,
    RAWD: 0,
    SINT: 0,
    STRG: 0,
    TRAI: 0,
    STRU: 0,
    UINT: 0,
    VERB: 0,
    NON_VERB: 0,
    NON_PAYLOAD: 0,
    UNDEFINED: 0,
};

const errors: string[] = [];

function publishStat() {
    let str: string = '';
    Object.keys(stat).forEach((key: string) => {
        str += `${key}: ${stat[key]}; `;
    });
    stdout.out(str, 'stat');

}

dltbuffer.on(DLT.Buffer.Events.packet, (packet: DLT.IPacketData) => {
    counters.size += packet.length;
    stdout.out(`Packet: ${packet.length} bytes;\tWSID: ${packet.standardHeader.WSID};\tWTMS: ${packet.standardHeader.WTMS};\tWEID: ${packet.standardHeader.WEID};\tEID: ${packet.standardHeader.EID};\tMCNT: ${packet.standardHeader.MCNT}`);
    stdout.out(`Packages read: ${++counters.packets}; ${counters.size} bytes; errors: ${counters.errors}`, 'done');
    if (packet.extendedHeader === undefined) {
        stat.NON_VERB += 1;
        return publishStat();
    }
    if (!packet.extendedHeader.VERB) {
        stat.NON_VERB += 1;
        return publishStat();
    }
    stat.VERB += 1;
    if (packet.payload === undefined || packet.payload.content.length === 0) {
        stat.NON_PAYLOAD += 1;
        return publishStat();
    }
    packet.payload.content.forEach((arg: DLT.IArgumentValue) => {
        if (stat[arg.type] === undefined) {
            stat.UNDEFINED += 1;
        } else {
            stat[arg.type] += 1;
        }
    });
    return publishStat();
});

dltbuffer.on(DLT.Buffer.Events.error, (error: DLT.Error) => {
    if (error.code !== DLT.EErrorCode.HEADER_MIN_LEN && error.code !== DLT.EErrorCode.PACKET_LEN) {
        errors.push(`Error: ${error.message}. Code: ${error.code}.`);
        stdout.out(`${errors.join('\n')}`, 'errors');
        counters.errors += 1;
    } else {
        stdout.out(`Packages pendin happens: ${++counters.pending}`, 'pendins');
    }
});

// Create connection to DLT demon
const socket: Net.Socket = Net.connect(DLT_DEMON_PORT, DLT_DEMON_IP, () => {
	console.log('Connected to DLT daemon.');
});

socket.on('data', (chunk: Buffer) => {
	dltbuffer.add(chunk);
});

socket.on('error', (error: Error) => {
	console.error(`Connection error: ${error.message}`);
});

socket.on('close', () => {
	process.exit();
});
