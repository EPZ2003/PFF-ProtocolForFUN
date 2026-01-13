/**
 [  HEADER (8 Bytes Fixed)  ] [     PAYLOAD (Variable)    ]
+--------+------+-------+-------+----------------------------+
| Magic  | Cmd  | ReqID |  Len  |      JSON / Binary Data    |
+--------+------+-------+-------+----------------------------+
|  0x69  | 0x01 | 1234  |   24  |  {"user": "admin"} ...     |
+--------+------+-------+-------+----------------------------+
  1 byte  1 byte 2 bytes  4 bytes      N bytes (defined in Len)
 */
// 2 bytes = 16 bit = 2^16 = 65536

import {EventEmitter} from "events";
import { HEADER_SIZE, MAGIC_BYTE } from "./Packet";

export class Parser extends EventEmitter{

    //We need to iniate this because we need it immediatly 
    private buffer: Buffer;

    constructor() {
        super();
        //If we don't allocate byte it will raise an error 
        this.buffer = Buffer.alloc(0);
    }

    //For the buffer attributs it's like prepare for the flow to arrive, if we don't do that
    //it's like we allocate memore after the flow arrives, that lead to data loss 

    //Call this method whenever 'data' event fires on the socket 
    public append (chunk:Buffer) {
        //We concat the buffer and the chunk that's up comming form the flow (TCP), 
        // because it's ensure that this packet (chunk) is catch by the current instance,
        // so it keep the order
        this.buffer = Buffer.concat([this.buffer,chunk])
        this.process();
    }

    private process (){
        //While we a at least the header ???
        while (this.buffer.length >= HEADER_SIZE) {
            //1.Peek at the length of the Length, its the length of the all packet 
            const payloadLen = this.buffer.readUInt32BE(4);
            const totalMsgLen = HEADER_SIZE + payloadLen;

            //2.  Check: if it's true that means that we have not any data left to process,
            // This said, okay wait to have the buffer (where contains data) with at least the minimum size 
            // to do the protocol 
            if (this.buffer.length < totalMsgLen){
                // that means that we have only the reader not the payload 
                // the process its finis 
                return;
            }

            //3. We have a full message size now we can slice it 
            //Because we need now a newbuffer of 1 byte (for the MAGIC NUMBER ), 
            // allocate an empty size in the buffer for the magic number that we will allocate later 
            const magic = this.buffer.readUInt8(0);
            if (magic != MAGIC_BYTE){
                this.emit('error', new Error('Invalid Protocol Magic'));
                return; 
            } 

            const command = this.buffer.readUInt8(1);
            const requestId = this.buffer.readUInt16BE(2);
            const payload = this.buffer.subarray(HEADER_SIZE,totalMsgLen)

            //4/ emit parsed data 
            this.emit('data',{command,requestId,payload})

            //5. "Cut" this message of the buffer and loop again 
            // In our case that means that it will erased memory allocated for the header and the payload
            this.buffer = this.buffer.subarray(totalMsgLen)
            

        }
    }
}