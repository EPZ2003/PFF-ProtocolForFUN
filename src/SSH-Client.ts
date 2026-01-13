import * as tls from 'tls';
import { Parser } from './Parser';
import { CMD_AUTH_OK, CMD_EXEC, CMD_EXEC_DATA, CMD_EXEC_EXIT, CMD_LOGIN, CMD_PING, CMD_PONG, createPacket } from './Packet';

// 1. Connecting using TLS
const client = tls.connect(3000,'localhost', {
    rejectUnauthorized:false //REQUIRED FOR self-signed certs but normally it need to be true
}, () =>{
    console.log('🔒 Secure Handshake Complete!')
    console.log('Cipher used:',client.getCipher())
})

const parser = new Parser();

client.on('data',(chunk:Buffer) => {parser.append(chunk)})

client.on('connect',()=>{
    //1.Handshakre && Login
    client.write(createPacket(CMD_LOGIN,1,2,{user:"Enzo"}))

    //2.Trigger THE SSH COMMAND
    console.log("Sending command..")
    client.write(createPacket(CMD_EXEC,1,2,{cmd: "ls /"}))
})

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
    if (packet.command === CMD_EXEC_DATA){
        process.stdout.write(packet.payload.toString())
    }

    if (packet.command === CMD_EXEC_EXIT){
        console.log("\n[Client] 🛑 Command finished.")
        client.end()
    }
    

})