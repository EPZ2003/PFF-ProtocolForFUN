import * as tls from 'tls'
import * as fs from 'fs';
import { Parser } from './Parser';
import { CMD_AUTH_OK, CMD_LOGIN, CMD_PING, CMD_PONG, createPacket, VERSION_PROTO } from './Packet';

//1. Load the "IdCArd " and secret key
const options: tls.TlsOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
};
const server = tls.createServer(options,(socket) => {
    console.log(`New Client: ${socket.remoteAddress}`);

    //Each conncetions needs its OWN parser(stateful)
    const parser = new Parser()

    //Hearbeat Manager manager 
    //1. Health check State
    let lastHeardFrom = Date.now()
    let isAlive = true;

    //2. The heartbeat loop (Every 5s)
    const intervealId = setInterval(() => {
        if(!isAlive) {return;}

        //Check has it been too long (> 15 seconds )
        const timeSinceLastMesssage = Date.now() - lastHeardFrom;
        if(timeSinceLastMesssage > 15000) {
            console.log(`[${socket.remoteAddress}] 💀 Client is a ZOMBIE. Terminating.`);        
            socket.destroy(); // Kill the connection
            isAlive = false;
            clearInterval(intervealId)
            return;
        }

        // Send PING 
        // We use reqID 0 because Ping don't need to be matched to a specific question 
        console.log(`[${socket.remoteAddress}] Sending PING...`)
        socket.write(createPacket(CMD_PING,0,2,{}))

    },5000)

    socket.on('data', (chunk:Buffer) => {
        // Update our "Last Heard" timestam whenever Any data arrives
        lastHeardFrom = Date.now()
        parser.append(chunk)
    });

    parser.on('data',(packet) => {
        if (packet.version != VERSION_PROTO){
            console.log(`not good version: v1${packet.version} instead of ${VERSION_PROTO}`);
            socket.destroy()
        }
        const strData = packet.payload.toString();
        console.log(`[CMD: ${packet.command}] [ID: ${packet.requestId}] Data: ${strData}`);

        //If it's a PONG, we don't need to do anythin specific.
        //The 'lastHeardFrom' update above already  saved them 
        if (packet.command === CMD_PONG){
            console.log(`[${socket.remoteAddress}] Received PONG (Client is healthy)`);
            return;
        }

        // Logic : If login (0x01), send sucess 
        if (packet.command === CMD_LOGIN){
            console.log("Handling Login...");
            const response = createPacket(CMD_AUTH_OK, packet.requestId,2,{status: "Auth Sucess LEZZZTOOO"})
            socket.write(response)
        }  
    })
    // 4. CLEANUP 
    socket.on('close',()=> {
        console.log(`[${socket.remoteAddress}] Disconnected cleanly.`);
        clearInterval(intervealId); //Critical: Stop the loop or memory leak 
        isAlive = false;
    })

    socket.on('error',(err) => {
        console.log(`Connection Error: ${err.message}`)
    })
    
    
});

server.listen(3000,() => console.log('🔒 Secure Server running on port 3000'))