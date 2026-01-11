import * as net from 'net'
import { Parser } from './Parser';
import { createPacket } from './Packet';

const server = net.createServer((socket) => {
    console.log(`New Client: ${socket.remoteAddress}`);

    //Each conncetions needs its OWN parser(stateful)
    const parser = new Parser()

    socket.on('data', (chunk:Buffer) => {
        parser.append(chunk)
    });

    parser.on('data',(packet) => {
        const strData = packet.payload.toString();
        console.log(`[CMD: ${packet.command}] [ID: ${packet.requestId}] Data: ${strData}`);

        // Logic : If login (0x01), send sucess 
        if (packet.command === 0x01){
            console.log("Handling Login...");
            const response = createPacket(0x02, packet.requestId,{status: "Auth Sucess"})
            socket.write(response)
        }
    })
    socket.on('end',()=> console.log('Client disconnedcted'));
    
});

server.listen(3000,() => console.log('Server running on 3000'))