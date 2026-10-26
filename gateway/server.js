import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const REJOIN_TTL_MS = 15 * 60 * 1000;
const clients = new Map();
const halls = new Map();
const invitations = new Map();
const guests = new Map();
const INVITE_TTL_MS = 60000;
function clearInvitations(id) {
  for (const [key, invite] of invitations) if (invite.from === id || invite.to === id) invitations.delete(key);
}
function available(client) { return client.name && !client.hallId && !client.busy; }

const clean = value => String(value || '').replace(/[^a-zA-Z0-9 '\-]/g, '').trim().slice(0, 32);
const send = (socket, message) => socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify(message));
const networkKey = () => 'online';
const publicHall = hall => ({ id: hall.id, code: hall.code, name: hall.name, hostName: hall.players[0].name, guestName: hall.players[1]?.name || null });
const inviteCode = () => {
  let code;
  do code = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase(); while ([...halls.values()].some(hall => hall.code === code));
  return code;
};

function cleanupExpired() {
  const now = Date.now();
  for (const [id, invite] of invitations) if (invite.expiresAt <= now) invitations.delete(id);
  for (const hall of halls.values()) if (hall.expiresAt && hall.expiresAt <= now) {
    for (const player of hall.players) if (player?.socket) {
      send(player.socket, { type: 'peer-left', canRejoin: false });
      const client = clients.get(player.socket);
      if (client) { client.hallId = null; client.playerIndex = null; }
    }
    halls.delete(hall.id);
  }
}

const nearby = key => {
  cleanupExpired();
  return [...halls.values()].filter(hall => hall.network === key && hall.players[0].socket && !hall.players[1]).map(publicHall);
};
const networkPresence = key => {
  const matching = [...clients.values()].filter(client => client.network === key);
  return { online: matching.length, names: [...new Set(matching.map(client => client.name).filter(Boolean))], players: matching.filter(available).map(client => ({ id: client.id, name: client.name })) };
};
const nearbyMessage = key => ({ type: 'halls', halls: nearby(key), presence: networkPresence(key), invitations: [...invitations.values()] });

function broadcastNearby(key) {
  const message = nearbyMessage(key);
  for (const [socket, client] of clients) if (client.network === key) send(socket, {...message, invitations: message.invitations.filter(invite => invite.from === client.id || invite.to === client.id)});
}

function removeHall(hall, message = { type: 'peer-left', canRejoin: false }) {
  for (const player of hall.players) if (player?.socket) {
    send(player.socket, message);
    const client = clients.get(player.socket);
    if (client) { client.hallId = null; client.playerIndex = null; }
  }
  halls.delete(hall.id);
  broadcastNearby(hall.network);
}

function leave(socket) {
  const client = clients.get(socket);
  if (!client) return;
  const key = client.network;
  const hall = client.hallId && halls.get(client.hallId);
  if (hall && client.playerIndex !== null) {
    const slot = hall.players[client.playerIndex];
    if (slot?.socket === socket) {
      slot.socket = null;
      hall.expiresAt = Date.now() + REJOIN_TTL_MS;
      send(hall.players[1 - client.playerIndex]?.socket, { type: 'peer-left', canRejoin: true, expiresAt: hall.expiresAt });
      broadcastNearby(hall.network);
    }
  }
  clearInvitations(client.id);
  clients.delete(socket);
  broadcastNearby(key);
}

export function handleMessage(socket, raw) {
  const client = clients.get(socket);
  if (!client) return;
  cleanupExpired();
  let message;
  try { message = JSON.parse(raw); } catch { return send(socket, { type: 'error', message: 'Invalid message.' }); }
  if (!message || typeof message !== 'object' || Array.isArray(message)) return send(socket, { type: 'error', message: 'Invalid message.' });
  if (message.type === 'ping') { client.alive = true; return send(socket, {type:'pong'}); }
  if (message.type === 'availability') {
    client.busy = Boolean(message.busy);
    if (client.busy) clearInvitations(client.id);
    return broadcastNearby(client.network);
  }
  if (message.type === 'list') {
    if (!client.identified) {
      let guest = guests.get(message.guestToken);
      if (!guest) { guest = {id:crypto.randomUUID(), token:crypto.randomUUID()}; guests.set(guest.token, guest); }
      const duplicate = [...clients.entries()].find(([other, value]) => other !== socket && value.id === guest.id);
      if (duplicate) { leave(duplicate[0]); duplicate[0].close(4000, 'Opened on another connection'); }
      client.id = guest.id; client.identified = true;
      send(socket, {type:'identity', clientId:guest.id, guestToken:guest.token});
    }
    client.name = clean(message.playerName) || client.name || null;
    return broadcastNearby(client.network);
  }
  if (message.type === 'host') {
    leaveHallOnly(socket);
    const id = crypto.randomUUID().slice(0, 8), token = crypto.randomUUID();
    const host = { socket, token, guestId: client.id, name: clean(message.playerName) || 'Blue Knight' };
    const hall = { id, code: inviteCode(), name: clean(message.name) || 'Nearby Game', network: client.network, players: [host, null], state: null, expiresAt: null };
    halls.set(id, hall); client.hallId = id; client.playerIndex = 0; client.name = host.name;
    send(socket, { type: 'hosting', hall: publicHall(hall), playerIndex: 0, rejoinToken: token });
    return broadcastNearby(client.network);
  }
  if (['challenge', 'accept', 'cancel', 'decline'].includes(message.type)) {
    const error = text => send(socket, {type:'error', message:text});
    const invite = invitations.get(String(message.invitationId || ''));
    if (message.type === 'cancel' || message.type === 'decline') {
      if (invite && (message.type === 'cancel' ? invite.from === client.id : invite.to === client.id)) invitations.delete(invite.id);
      return broadcastNearby(client.network);
    }
    if (!available(client)) return error('You are not available for a duel.');
    if (message.type === 'challenge') {
      const target = [...clients.values()].find(value => value.id === message.playerId && available(value));
      if (!target || target === client) return error('That player is no longer available.');
      if ([...invitations.values()].some(value => value.from === client.id && value.to === target.id || value.from === target.id && value.to === client.id)) return error('A challenge is already pending.');
      if ([...invitations.values()].filter(value => value.from === client.id).length >= 10) return error('Wait for your pending challenges.');
      const id = crypto.randomUUID();
      invitations.set(id, {id, from:client.id, to:target.id, expiresAt:Date.now()+INVITE_TTL_MS});
      return broadcastNearby(client.network);
    }
    if (!invite || invite.to !== client.id) { broadcastNearby(client.network); return error('That challenge has ended.'); }
    const targetEntry = [...clients.entries()].find(([, value]) => value.id === invite.from && available(value));
    if (!targetEntry) return error('That player is no longer available.');
    clearInvitations(client.id); clearInvitations(targetEntry[1].id);
    const [targetSocket, target] = targetEntry, id = crypto.randomUUID().slice(0, 8);
    const host = { socket, token: crypto.randomUUID(), guestId: client.id, name: client.name || 'Blue Knight' };
    const guest = { socket: targetSocket, token: crypto.randomUUID(), guestId: target.id, name: target.name || 'Gold Knight' };
    const hall = { id, code: inviteCode(), name: 'Nearby Duel', network: client.network, challengerId: invite.from, recipientId: invite.to, acceptedAt: Date.now(), players: [host, guest], state: null, expiresAt: null };
    halls.set(id, hall);client.hallId=id;client.playerIndex=0;target.hallId=id;target.playerIndex=1;
    send(socket, { type: 'hosting', hall: publicHall(hall), playerIndex: 0, rejoinToken: host.token });
    send(targetSocket, { type: 'joined', hall: publicHall(hall), playerIndex: 1, rejoinToken: guest.token });
    send(socket, { type: 'peer-joined', guestName: guest.name });
    return broadcastNearby(client.network);
  }
  if (message.type === 'join') {
    const requestedCode = String(message.code || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
    const hall = message.hallId ? halls.get(String(message.hallId)) : [...halls.values()].find(candidate => candidate.code === requestedCode);
    const hasInvite = Boolean(requestedCode && hall?.code === requestedCode);
    if (!hall || (!hasInvite && hall.network !== client.network) || hall.players[1] || !hall.players[0].socket) return send(socket, { type: 'error', code: 'hall-unavailable', message: 'That game is no longer available. Check the code and try again.' });
    leaveHallOnly(socket);
    const token = crypto.randomUUID(), guest = { socket, token, name: clean(message.playerName) || 'Gold Knight' };
    hall.players[1] = guest; hall.expiresAt = null; client.hallId = hall.id; client.playerIndex = 1; client.name = guest.name;
    send(socket, { type: 'joined', hall: publicHall(hall), playerIndex: 1, rejoinToken: token });
    send(hall.players[0].socket, { type: 'peer-joined', guestName: guest.name });
    return broadcastNearby(client.network);
  }
  if (message.type === 'rejoin') {
    const hall = halls.get(String(message.hallId || ''));
    const playerIndex = hall?.players.findIndex(player => player?.token === message.token) ?? -1;
    if (!hall || playerIndex < 0) return send(socket, { type: 'error', code: 'rejoin-expired', message: 'The saved game has expired.' });
    leaveHallOnly(socket);
    const player = hall.players[playerIndex];
    if (player.socket && player.socket !== socket) player.socket.close(4000, 'Rejoined from another connection');
    clearInvitations(client.id);
    player.socket = socket; client.hallId = hall.id; client.playerIndex = playerIndex; client.name = player.name;
    const other = hall.players[1 - playerIndex];
    hall.expiresAt = other?.socket ? null : hall.expiresAt || Date.now() + REJOIN_TTL_MS;
    send(socket, { type: 'rejoined', hall: publicHall(hall), playerIndex, playerName: player.name, rejoinToken: player.token, waitingForPeer: !other?.socket });
    if (hall.state) send(socket, { type: 'relay', payload: { kind: 'state', state: hall.state } });
    send(other?.socket, { type: 'peer-rejoined', playerName: player.name });
    return broadcastNearby(client.network);
  }
  if (message.type === 'relay') {
    const hall = client.hallId && halls.get(client.hallId);
    if (!hall || client.playerIndex === null) return;
    if (message.payload?.kind === 'state' && message.payload.state) hall.state = message.payload.state;
    send(hall.players[1 - client.playerIndex]?.socket, { type: 'relay', payload: message.payload });
  }
}

function leaveHallOnly(socket) {
  const client = clients.get(socket), hall = client?.hallId && halls.get(client.hallId);
  if (hall) removeHall(hall);
}

const server = createServer((request, response) => {
  cleanupExpired();
  response.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  response.end(JSON.stringify({ service: 'Barrier Knights Realm Gateway', status: 'ready', openHalls: halls.size, rejoinMinutes: REJOIN_TTL_MS / 60000 }));
});
const wss = new WebSocketServer({ server, maxPayload: 262144 });
wss.on('connection', (socket, request) => {
  clients.set(socket, { id: crypto.randomUUID(), network: networkKey(request), hallId: null, playerIndex: null, name: null });
  send(socket, { type: 'welcome', clientId: clients.get(socket).id, rejoinMinutes: REJOIN_TTL_MS / 60000 });
  socket.on('message', raw => handleMessage(socket, raw.toString()));
  socket.on('close', () => leave(socket));
  socket.on('error', () => leave(socket));
});

if (process.env.NODE_ENV !== 'test') server.listen(PORT, () => console.log(`Realm Gateway listening on ${PORT}`));
const maintenance = setInterval(() => {
  for (const [socket, client] of clients) {
    if (Date.now() - (client.lastSeen || Date.now()) > 45000) { socket.terminate(); leave(socket); }
    else if (!client.lastPing || Date.now()-client.lastPing>15000) { client.lastPing=Date.now(); client.lastSeen ||= Date.now(); socket.ping(); }
  }
  const before = invitations.size + halls.size;
  cleanupExpired();
  if (before !== invitations.size + halls.size) broadcastNearby('online');
}, 1000);
maintenance.unref();
wss.on('connection', socket => socket.on('pong', () => { const client=clients.get(socket); if(client) client.lastSeen=Date.now(); }));
server.on('close', () => clearInterval(maintenance));
export { server, wss, clients, halls, invitations, REJOIN_TTL_MS };
