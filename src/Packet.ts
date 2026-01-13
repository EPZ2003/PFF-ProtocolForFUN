/**
 [  HEADER (9 Bytes Fixed)               ][     PAYLOAD (Variable)      ]
+--------+------+-------+-------+---------+-----------------------------+
| Magic  | Cmd  | ReqID |  Len  | Version |  JSON / Binary Data         |
+--------+------+-------+-------+---------+-----------------------------+
|  0x69  | 0x01 | 1234  |   24  |  2      |  {"user": "admin"} ...      |
+--------+------+-------+-------+---------------------------------------+
  1 byte  1 byte 2 bytes 4 bytes|1 byte   | N bytes (defined in Len)
 */


// src/Packets.ts
export const MAGIC_BYTE = 0x69;
export const HEADER_SIZE = 9 // 1 magic + 1cmd + 2 reqId + 4 len 

//Version of the protocol
export const VERSION_PROTO = 2

//Command list 
export const CMD_LOGIN = 0x01
export const CMD_AUTH_OK = 0x02;

export const CMD_PING = 0X03;
export const CMD_PONG = 0x04;

export const CMD_ERROR = 0x0FF;

export interface Packet {
    command: number;
    requestId: number;
    version: number;
    payload: Buffer;
}

// Helper to tunr a JSON object into a binary buffer ready for network 
export function createPacket(command: number , requestId: number, version:number,data:object): Buffer {
    //Convert data to buffer
    const payload = Buffer.from(JSON.stringify(data));
    //allocates 8 bytes for the header
    const header = Buffer.alloc(HEADER_SIZE);

    //Write the header
    header.writeUInt8(MAGIC_BYTE, 0);       // Byte 0: Magic 
    header.writeUInt8(command, 1);          // Byte 1: command 
    header.writeUInt16BE(requestId, 2);     // Byte 2-3 (so 2 bytes = 2 octes = 2 x 8 bits = 16 )
    header.writeUInt8(version,3);
    header.writeUInt32BE(payload.length, 4) // Byte 4-7 (so 4 bytes = 4 octes = 4 x 8bits = 32)

    //Return the packet in buffer with first the header then the payload (== data )
    return Buffer.concat([header,payload])
}