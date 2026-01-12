//The client needs to read a file from my harddrive,
    // cut it in smalll pieces (packets), and feed them to the server 
import * as tls from 'tls';
import * as fs from 'fs';
import * as path from 'path';
import { CMD_FILE_CHUNK, CMD_FILE_END, CMD_FILE_START, CMD_LOGIN, createPacket } from './Packet';
//The key concepts is to use a **chunk size" (== 1024 bytes)
//1.set up the client connection (secure)
const client = tls.connect(3000,'localhost',{rejectUnauthorized:false},()=>{
    console.log('connected to the server')

    //Authentificate first (the bouncer)
    client.write(createPacket(CMD_LOGIN,1,2,{blabla:"fdsfsdff"}))

    //Start upload
    uploadFile('./fuck.png')
})

function uploadFile(filePath:string) {
    const fileName = path.basename(filePath);
    const fileBuffer:Buffer = fs.readFileSync(filePath); // Read full file into RAM (simple version), to be bale to get the lenghth of the buffer

    //1. send metadata (The "header of the transfer"), 
    // need to have the same key than the one in the server side for the file transfer to the join of the path join 
    client.write(createPacket(CMD_FILE_START,1,2,{filename:fileName,size:fileBuffer.length}));

    //2. Loop and send chunks
    const CHUNK_SIZE = 1024 // 1KB byte per packet
    //Number of bytes == buffer.length
    let sentBytes = 0;
    
    while (sentBytes < fileBuffer.length) {
        //Calculate the slice 
        const end = Math.min(sentBytes + CHUNK_SIZE, fileBuffer.length)
        const chunk = fileBuffer.subarray(sentBytes,end)

        //Send the slice data
        // Note : createPacket handles paylodsautomatically if you build it right 
        // If you createPacket expects an object, we might need to tweak it 
        //For now lets asssume that it take a buffer as a payload 
        client.write(createPacket(CMD_FILE_CHUNK,1,2,chunk))

        sentBytes += chunk.length;
        process.stdout.write(`\rUploading... ${Math.round((sentBytes / fileBuffer.length) * 100)}%`);
    }

    //3. send Finish flag 
    client.write(createPacket(CMD_FILE_END,1,2,{}));
    console.log('done')
    client.end();

}
