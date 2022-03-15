// eslint-disable-next-line no-unused-vars
const { packetTypes, PacketType } = require("./packets");

/**
 * @typedef {Object} PacketResult
 * @property {Number} type Packet type.
 * @property {Array.<any>} data Packet data.
 */

/**
 * Parse joined packets from single buffer.
 * @param {ArrayBuffer} buffer Input buffer with joined packets.
 * @returns {Array.<PacketResult>}
 */
function parsePacketsFromCombinedBuffer(buffer) {
    const view = new DataView(buffer);

    const packets = [];

    let byteOff = 0;
    while (byteOff < view.byteLength) {
        const packetTypeId = view.getUint8(byteOff + 0);
        /** @type {PacketType} */
        const packetType = Object.values(packetTypes).find(t => t.packetTypeId === packetTypeId);

        if (!packetType) {
            return console.error(`Couldn't find packet parser of type ${packetTypeId}!`);
        }

        const thisPacketRegion = buffer.slice(byteOff, byteOff + packetType.byteLength);
        byteOff += packetType.byteLength;

        packets.push({
            type: packetTypeId,
            data: packetType.decode(thisPacketRegion),
        })
    }

    return packets
}

module.exports = { parsePacketsFromCombinedBuffer }