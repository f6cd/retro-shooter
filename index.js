import WebSocket, { WebSocketServer } from "ws"
import express from "express";
import * as path from 'path';
import { packetTypes, parsePacketsFromCombinedBuffer } from "shared";
import {Blob} from "node:buffer";

// We store userIds as a 1 byte unsigned int; therefore we have a max of 128 players in a game at once!
const MAX_PLAYERS = 128;

/**
 * Join given array buffers together.
 * @param {Array.<ArrayBuffer>} buffers Array of ArrayBuffers.
 * @returns {Promise.<ArrayBuffer>} Joined buffer.
 */
 function joinPackets(buffers) {
  // https://gist.github.com/72lions/4528834#gistcomment-4025039
  return new Blob(buffers).arrayBuffer()
}

const __dirname = path.resolve();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 5002

const expressServer = express()
  .use(express.static(path.join(__dirname, '/build/client')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocketServer({ server: expressServer });

/** @type {WeakMap.<WebSocket, Array>} */
const socketQueues = new WeakMap();

/**
 * Send to all connected, open sockets.
 * @param {WebSocket} except Object to exclude.
 */
function sendToLivingClients(except, msg) {
  return wss.clients.forEach(client => {
    if (client.OPEN && client !== except && socketQueues.has(client)) {
      socketQueues.get(client).push(msg);
    }
  })
}

function flushSendQueues() {
  wss.clients.forEach(client => {
    if (!socketQueues.has(client)) return;

    const queue = socketQueues.get(client);
    if (queue.length == 0) return;

    socketQueues.set(client, []);

    joinPackets(queue).then(joinedBuffer => {
      client.send(joinedBuffer);
    })
  })
}

/** @type {Object.<number, WeakRef.<WebSocket>} */
const socketsByUserId = {};

/**
 * Get a number unique to this session.
 * @returns {Number}
 */
function getSessionUnique() {
  for (let i = 0; i < MAX_PLAYERS; i++) {
    if (!socketsByUserId[i]) return i;    
  }
}

/**
 * On received packet from client.
 * @param {WebSocket} senderClient Sending client.
 * @param {Number} senderUserId Sender userId.
 * @param {import("shared/packetUtils").PacketResult} packet Packet type.
 */
function onReceivedPacket(senderClient, senderUserId, packet) {
  switch (packet.type) {
    case packetTypes.TYPE_MOVEMENT_SEND.packetTypeId:
      // Attach sender userId, so we can move a character on each client.
      sendToLivingClients(
        senderClient,
        packetTypes.TYPE_MOVEMENT_RECV.encode(senderUserId, ...packet.data),
      );
      break;
    case packetTypes.TYPE_SHOT.packetTypeId:
      sendToLivingClients(senderClient, packetTypes.TYPE_SHOT.encode(...packet.data));
      break;
    case packetTypes.TYPE_HIT_PLAYER_SEND.packetTypeId:
      const hitUserId = packet.data[0];
      const hitClient = socketsByUserId[hitUserId].deref();
      if (hitClient)
        hitClient.send(packetTypes.TYPE_HIT_PLAYER_RECV.encode());
      break;
    case packetTypes.TYPE_UPDATE_HEALTH_SEND.packetTypeId:
      sendToLivingClients(senderClient, packetTypes.TYPE_UPDATE_HEALTH_RECV.encode(senderUserId, packet.data[0]));
      break;
    case packetTypes.TYPE_PLAY_SOUND_SEND.packetTypeId:
      sendToLivingClients(senderClient, packetTypes.TYPE_PLAY_SOUND_RECV.encode(senderUserId, packet.data[0]));
      break;
    default:
      break;
  }
}

wss.on('connection', (client) => {
  const thisUserId = getSessionUnique();
  socketsByUserId[thisUserId] = new WeakRef(client);

  socketQueues.set(client, []);

  console.log(`Client ${thisUserId} connected!`);

  client.on('close', () => {
    // Send out disconnect signal.
    console.log(`Client ${thisUserId} disconnected!`);
    sendToLivingClients(client, packetTypes.TYPE_DISCONNECT.encode(thisUserId));
    delete socketsByUserId[thisUserId];
    socketQueues.delete(client);
  });

  const onSend = onReceivedPacket.bind(null, client, thisUserId)

  client.on('message', async (msg) => {
    // Not sure why, but this seems to strip out some arbitrary 4 bytes of data at the start of the message.
    const buf = new Uint8Array(msg).buffer;
    parsePacketsFromCombinedBuffer(buf).forEach(packet => onSend(packet));
  });

  client.send(packetTypes.TYPE_TRANSFER_STRING.encode("Hello world!"));
});

setInterval(() => {
  flushSendQueues();
}, 1000 / 45);