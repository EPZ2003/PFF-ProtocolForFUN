import * as net from 'net';
import { Parser } from './Parser';
import { CMD_LOGIN, CMD_PING, CMD_PONG, createPacket } from './Packet';

const client = new net.Socket()
const parser = new Parser();

client.connect(3000, 'localhost',() => {
    console.log('Connected')
    //Send the login 
    client.write(createPacket(CMD_LOGIN,1,{user:'Enzo le goat'}));
});

client.on('data',(chunk:Buffer) => {parser.append(chunk)})

parser.on('data', (packet) => {
   /* // Automatic Pong reply Broken so doesnt send it
    if (packet.command === CMD_PING) {
        console.log("Client] Server asked PING? Sending PONG!")

        //Reply immediately
        const pongPacket = createPacket(CMD_PONG, 0, {})
        return;
    }*/
    if (packet.command === 0x02){
        console.log("[Client] Server said:", packet.payload.toString())
    }
})