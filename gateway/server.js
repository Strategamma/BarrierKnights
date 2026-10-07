import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const clients = new Map();
const halls = new Map();
const clean = value => String(value || '').replace(/[^a-zA-Z0-9 '\-]/g, '').trim().slice(0, 32);
const send = (socket, message) => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify(message));
const networkKey = request => String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || '').split(',')[0].trim();
const nearby = key => [...halls.values()].filter(hall => hall.network === key && !hall.guest).map(({ id, name, hostName }) => ({ id, name, hostName }));

function broadcastNearby(key) {
  for (const [socket, client] of clients) if (client.network === key) send(socket, { type: 'halls', halls: nearby(key) });
}

function leave(socket) {
  const client = clients.get(socket);
  if (!client) return;
  const hall = client.hallId && halls.get(client.hallId);
  if (hall) {
    const other = hall.host === socket ? hall.guest : hall.host;
    if (other) send(other, { type: 'peer-left' });
    halls.delete(hall.id);
    broadcastNearby(hall.network);
  }
  clients.delete(socket);
}

export function handleMessage(socket, raw) {
  const client = clients.get(socket);
  if (!client) return;
  let message;
  try { message = JSON.parse(raw); } catch { return send(socket, { type: 'error', message: 'Invalid message.' }); }
  if (message.type === 'list') return send(socket, { type: 'halls', halls: nearby(client.network) });
  if (message.type === 'host') {
    leaveHallOnly(socket);
    const id = crypto.randomUUID().slice(0, 8);
    const hall = { id, name: clean(message.name) || 'Unnamed Bastion', hostName: clean(message.playerName) || 'Blue Knight', network: client.network, host: socket, guest: null };
    halls.set(id, hall); client.hallId = id;
    send(socket, { type: 'hosting', hall: { id, name: hall.name, hostName: hall.hostName }, playerIndex: 0 });
    return broadcastNearby(client.network);
  }
  if (message.type === 'join') {
    const hall = halls.get(String(message.hallId || ''));
    if (!hall || hall.network !== client.network || hall.guest) return send(socket, { type: 'error', message: 'That hall is no longer open.' });
    leaveHallOnly(socket); hall.guest = socket; client.hallId = hall.id;
    send(socket, { type: 'joined', hall: { id: hall.id, name: hall.name, hostName: hall.hostName }, playerIndex: 1 });
    send(hall.host, { type: 'peer-joined', guestName: clean(message.playerName) || 'Gold Knight' });
    return broadcastNearby(client.network);
  }
  if (message.type === 'relay') {
    const hall = client.hallId && halls.get(client.hallId);
    if (!hall) return;
    const other = hall.host === socket ? hall.guest : hall.host;
    if (other) send(other, { type: 'relay', payload: message.payload });
  }
}

function leaveHallOnly(socket) {
  const client = clients.get(socket), hall = client?.hallId && halls.get(client.hallId);
  if (!hall) return;
  const other = hall.host === socket ? hall.guest : hall.host;
  if (other) send(other, { type: 'peer-left' });
  halls.delete(hall.id); client.hallId = null; broadcastNearby(hall.network);
}

const server = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  response.end(JSON.stringify({ service: 'Barrier Knights Realm Gateway', status: 'ready', openHalls: halls.size }));
});
const wss = new WebSocketServer({ server, maxPayload: 262144 });
wss.on('connection', (socket, request) => {
  clients.set(socket, { network: networkKey(request), hallId: null });
  send(socket, { type: 'welcome' });
  socket.on('message', raw => handleMessage(socket, raw.toString()));
  socket.on('close', () => leave(socket));
  socket.on('error', () => leave(socket));
});

if (process.env.NODE_ENV !== 'test') server.listen(PORT, () => console.log(`Realm Gateway listening on ${PORT}`));
export { server, wss, clients, halls };
