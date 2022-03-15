import { PacketType, parsePacketsFromCombinedBuffer } from "shared";

/**
 * Join given array buffers together.
 * @param {Array.<ArrayBuffer>} buffers Array of ArrayBuffers.
 * @returns {Promise.<ArrayBuffer>} Joined buffer.
 */
function joinPackets(buffers) {
    // https://gist.github.com/72lions/4528834#gistcomment-4025039
    return new Blob(buffers).arrayBuffer()
}

let packetQueue = [];

let HOST;
if (USE_LOCAL_CONNECTION) {
    HOST = "ws://localhost:5002"
} else {
    HOST = location.origin.replace(/^http/, 'ws')
}

/**
 * Class responsible for communicating with server.
 */
export default class NetService {
    /**
     * Construct new Net class.
     */
    constructor() {
        this.ws = new WebSocket(HOST);

        this.ws.onmessage = (msg) => {
            // If we have anything unsent, make sure we send it now.
            // This avoids unsent packets aimlessly queuing up if we're tabbed out.
            this.flushAndSendMessages();

            msg.data.arrayBuffer().then(buff => {
                // Parse packets.
                parsePacketsFromCombinedBuffer(buff).forEach(packet => {
                    (this._handlers[packet.type] || []).forEach(handler => handler(packet.data));
                })
            })
        }

        /** @type {Object.<string, Array>} */
        this._handlers = {};
    }

    /**
     * Await the socket being ready and able to send data.
     * @returns {Promise} Websocket open promise.
     */
    promiseOpen() {
        return new Promise((resolve, reject) => {
            if (this.open) resolve();

            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
        })
    }

    /**
     * Send a Javascript object to the server.
     * @param {ArrayBuffer} bufferMessage Encoded message to send.
     */
    send(bufferMessage) {
        if (this.ws.readyState !== 1) {
            console.warn("Attempted to send message on closed socket!!");
            return;
        }
        packetQueue.push(bufferMessage);
    }

    /**
     * Send all queued messages.
     */
    flushAndSendMessages() {
        const toSendQueue = packetQueue;
        packetQueue = [];

        if (toSendQueue.length === 0) return;

        joinPackets(toSendQueue).then(buffer => this.ws.send(buffer));
    }

    /**
     * Attach a handler for a packet.
     * @param {PacketType} packetType Packet to watch for.
     * @param {Function} callback Callback to fire with object.
     */
    attachHandler(packetType, callback) {
        const packetId = packetType.packetTypeId;

        /** @type {Array} */
        this._handlers[packetId] = this._handlers[packetId] || [];
        this._handlers[packetId].push(callback);
    }

    get open() {
        return this.ws.readyState === 1;
    }
}
