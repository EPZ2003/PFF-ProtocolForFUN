import { createPacket } from "./Packet";
import { Parser } from "./Parser"

console.log("=== STARTING PARSER STRESS TEST ===");

// 1. Setup
const parser = new Parser();
let messagesReceived = 0;

parser.on('data', (packet) => {
    console.log(`✅ SUCCESS! Parsed packet. ID: ${packet.requestId}`);
    messagesReceived++;
});

// 2. Create a dummy packet
// Header (8 bytes) + Payload (17 bytes) = 25 bytes total
const packet = createPacket(0x01, 1235, { test: "Torturefds Tdfsffffffffffffest",rerezr:"#{~#{~#'" });

console.log(`Original Packet Size: ${packet.length} bytes`);

// 3. THE TORTURE: Feed it 1 byte at a time
// This simulates the worst network connection possible.
console.log("feeding data byte-by-byte...");

for (let i = 0; i < packet.length; i++) {
    const singleByte = packet.subarray(i, i + 1); // Slice just 1 byte
    parser.append(singleByte);
    
    // We expect NOTHING to happen until the very last byte
    if (i < packet.length - 1) {
        if (messagesReceived > 0) {console.error("❌ FAIL: Packet parsed too early!")};
    }
}

// 4. Verify
if (messagesReceived === 1) {
    console.log("🎉 TEST PASSED: The parser reassembled the fragments correctly.");
} else {
    console.log("❌ TEST FAILED: Parser did not emit the packet.");
}