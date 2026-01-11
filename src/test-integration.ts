import * as net from 'net';
import { Parser } from './Parser';
import { createPacket } from './Packet';
const reqId = 99
// ---Server Simul
const server = net.createServer((socket) => {
    const parser = new Parser();
    socket.on('data', (chunk: Buffer) => parser.append(chunk));

    parser.on('data', (packet) => {
        console.log(`_____________________\n[Server] Received Request ID: ${packet.requestId}`);
        // check if it's the right protocol 
        if(packet.command === 0x01){
            console.log('[Server] Auth Command recognized. Sending Ok')
            //Reply with the same request ID so client knows it's from them 
            const response = createPacket(0x02, packet.requestId, { status: "OK", echo: packet.payload.toString() })
            socket.write(response)
        }else{
            console.log('[Server] unknow command')
            const errorResponse = createPacket(
                0xFF,// Command 0xFF = error
                packet.requestId,
                {error:"Invalid command :"+ packet.command + '-------'} 
            );
            socket.write(errorResponse)
        }
        console.log('_____________________')
        
    })
});
server.listen(3000)
//________________________________________________________________________________
// --- Client Simulation----
const client = new net.Socket();
// Client needs a parser too because 
// the server and the client need to speak the same language
const clientParser = new Parser();
client.connect(3000,'localhost',()=>{
     console.log('_____________________')
    console.log(`[Client] Connected. Sending Request ID: ${reqId}`);
    const reqAuthtificated = createPacket(0x01,reqId, {msg: "Helflo world"})
    const reqUnvalid = createPacket(0xB3,reqId+3, {msg: "test"})
    client.write(reqAuthtificated)
    client.write(reqUnvalid)
})

//Handling incoming data from Server 
client.on('data', (chunk:Buffer) => clientParser.append(chunk));

clientParser.on('data',(packet) =>{
    console.log(`[Client] Received Response for ID: ${packet.requestId}`);
    console.log(`[Client] Data: ${packet.payload.toString()}`);

    if(packet.requestId === reqId){
        console.log("🎉 TEST PASSED: Request ID matches!")
        //Close the listenning froim the client 
        client.end()
        //Stop the server
        server.close()
        //Kill the ram using 
        process.exit(0)
    }
})


