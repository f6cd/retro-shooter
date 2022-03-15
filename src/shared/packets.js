/**
 * @typedef {Object} NumDataType
 * @property {Number} length Length in bytes.
 * @property {Function} read Read method.
 * @property {Function} set Set method.
 */

/** @type {Object.<string, NumDataType>} */
const DATA_TYPES = {
    Float32: {
        length: Float32Array.BYTES_PER_ELEMENT,
        read: DataView.prototype.getFloat32,
        set: DataView.prototype.setFloat32
    },
    Float64: {
        length: Float64Array.BYTES_PER_ELEMENT,
        read: DataView.prototype.getFloat64,
        set: DataView.prototype.setFloat64
    },
    Int16: {
        length: Int16Array.BYTES_PER_ELEMENT,
        read: DataView.prototype.getInt16,
        set: DataView.prototype.setInt16
    },
    Int32: {
        length: Int32Array.BYTES_PER_ELEMENT,
        read: DataView.prototype.getInt32,
        set: DataView.prototype.setInt32
    },
    Int8: {
        length: Int8Array.BYTES_PER_ELEMENT,
        read: DataView.prototype.getInt8,
        set: DataView.prototype.setInt8
    },
    Uint16: {
        length: Uint16Array.BYTES_PER_ELEMENT,
        read: DataView.prototype.getUint16,
        set: DataView.prototype.setUint16
    },
    Uint32: {
        length: Uint32Array.BYTES_PER_ELEMENT,
        read: DataView.prototype.getUint32,
        set: DataView.prototype.setUint32
    },
    Uint8: {
        length: Uint8Array.BYTES_PER_ELEMENT,
        read: DataView.prototype.getUint8,
        set: DataView.prototype.setUint8
    },
    ShortString: {
        length: Uint8Array.BYTES_PER_ELEMENT * 16,
        read: function (byteOff) {
            /** @type {DataView} */
            const view = this;
            
            const typeLength = DATA_TYPES.ShortString.length;
            const array = new Uint8Array(view.buffer, byteOff, typeLength);
            
            // Find the highest index of the string array that isn't blank, then use only that region for decoding.
            // Otherwise we will end up with funny invalid characters at the end of the string.
            let highestIndex = -1;
            do {
                highestIndex++;
            } while (array[highestIndex] !== 0);
            const validCharactersArray = array.slice(0, highestIndex);

            const decode = new TextDecoder();
            return decode.decode(validCharactersArray);
        },
        set: function (byteOff, value) {
            /** @type {DataView} */
            const view = this;

            const typeLength = DATA_TYPES.ShortString.length;
            const blankArray = new Uint8Array(view.buffer, byteOff, typeLength);
           
            const encoder = new TextEncoder();
            const encodedArray = encoder.encode(value);

            if (encodedArray.length > blankArray.length)
                console.warn(`String '${value}' is too large to fit in array buffer of size ${typeLength} bytes! It encodes to ${encodedArray.byteLength} bytes.`);
            else
                blankArray.set(encodedArray, 0);
        }
    }
}

class PacketType {
    /**
     * Packet.
     * @param {Number} id 
     * @param {Array.<NumDataType>} layout 
     */
    constructor(id, layout) {
        this.packetTypeId = id;

        this._layout = layout;

        // Add 1 for packet type byte.
        this.byteLength = 1;
        this._layout.forEach(type => this.byteLength += type.length);
    }

    /**
     * Create buffer for this packet.
     * @returns {ArrayBuffer} Encoded array buffer.
     */
    encode(...v) {
        const buffer = new ArrayBuffer(this.byteLength);
        const view = new DataView(buffer);
        view.setUint8(0, this.packetTypeId);

        let byteOff = 1;

        for (let i = 0; i < v.length; i++) {
            const value = v[i];
            const dataType = this._layout[i];

            dataType.set.bind(view)(byteOff, value);

            byteOff += dataType.length;
        }

        return buffer;
    }

    /**
     * Decode packet from raw byte buffer.
     * @param {ArrayBuffer} buffer Packet buffer.
     * @returns {Array.<any>} Decoded values.
     */
    decode(buffer) {
        const view = new DataView(buffer);

        const values = [];

        let byteOff = 1;
        this._layout.forEach(type => {
            values.push(type.read.bind(view)(byteOff));
            byteOff += type.length;
        })

        return values;
    }

    test() {
        return new Uint8Array(packetBuffer, 0, 1)[0] === this.packetTypeId;
    }
}

// Values: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays

const packetTypes = {

    TYPE_DISCONNECT: new PacketType(0, [
        DATA_TYPES.Uint8,  // userId
    ]),

    TYPE_MOVEMENT_SEND: new PacketType(1, [
        DATA_TYPES.Float32, // x
        DATA_TYPES.Float32, // y
        DATA_TYPES.Float32, // z
        DATA_TYPES.Float32, // angle
    ]),
    TYPE_MOVEMENT_RECV: new PacketType(2, [
        DATA_TYPES.Uint8,  // userId
        DATA_TYPES.Float32, // x
        DATA_TYPES.Float32, // y
        DATA_TYPES.Float32, // z
        DATA_TYPES.Float32, // angle
    ]),

    TYPE_PLAY_SOUND_SEND: new PacketType(3, [
        DATA_TYPES.Uint16,  // sound index
    ]),
    TYPE_PLAY_SOUND_RECV: new PacketType(4, [
        DATA_TYPES.Uint8,  // userId
        DATA_TYPES.Uint16,  // sound index
    ]),

    TYPE_UPDATE_HEALTH_SEND: new PacketType(5, [
        DATA_TYPES.Float32, // new health value
    ]),
    TYPE_UPDATE_HEALTH_RECV: new PacketType(6, [
        DATA_TYPES.Uint8,  // userId
        DATA_TYPES.Float32, // new health value
    ]),

    TYPE_SHOT: new PacketType(7, [
        DATA_TYPES.Float32, // ox
        DATA_TYPES.Float32, // oy
        DATA_TYPES.Float32, // oz
        DATA_TYPES.Float32, // px
        DATA_TYPES.Float32, // py
        DATA_TYPES.Float32, // pz
    ]),

    TYPE_HIT_PLAYER_SEND: new PacketType(8, [
        DATA_TYPES.Uint8,  // hit userId
    ]),
    TYPE_HIT_PLAYER_RECV: new PacketType(9, [
    ]),

    TYPE_TRANSFER_STRING: new PacketType(10, [
        DATA_TYPES.ShortString,
    ])
}

module.exports = { PacketType, packetTypes }