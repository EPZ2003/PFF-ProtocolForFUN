import * as tls from 'tls';
import { Parser } from './Parser';
import { CMD_AUTH_OK, CMD_LOGIN, CMD_PING, CMD_PONG, createPacket } from './Packet';

// 1. Connecting using TLS
const client = tls.connect(3000,'localhost', {
    rejectUnauthorized:false //REQUIRED FOR self-signed certs but normally it need to be true
}, () =>{
    console.log('🔒 Secure Handshake Complete!')
    console.log('Cipher used:',client.getCipher())
    const requestPacket = createPacket(CMD_LOGIN,1,2,{data:"TE"})
    client.write(requestPacket)
})


const parser = new Parser();


client.on('data',(chunk:Buffer) => {parser.append(chunk)})

parser.on('data', (packet) => {
    // Automatic Pong reply 
    if (packet.command === CMD_PING) {
        console.log("Client] Server asked PING? Sending PONG!")

        //Reply immediately
        const pongPacket = createPacket(CMD_PONG, 0,2, {})
        client.write(pongPacket)
        console.log("Client] pong sended!")
        return;
    }
    

})