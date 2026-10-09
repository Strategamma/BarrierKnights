import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

process.env.NODE_ENV = 'test';
const { server } = await import('./server.js');
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `ws://127.0.0.1:${server.address().port}`;
const connect = (address = '') => new Promise(resolve => { const ws = new WebSocket(url, address ? { headers: { 'x-forwarded-for': address } } : undefined); ws.once('open', () => resolve(ws)); });
const next = (ws, type) => new Promise(resolve => { const listener = raw => { const value = JSON.parse(raw); if (value.type === type) { ws.off('message', listener); resolve(value); } }; ws.on('message', listener); });
const noMessage = (ws, type, delay = 60) => new Promise((resolve, reject) => {
  const listener = raw => { const value = JSON.parse(raw); if (value.type === type) { cleanup(); reject(new Error(`Unexpected ${type} message`)); } };
  const timer = setTimeout(() => { cleanup(); resolve(); }, delay);
  const cleanup = () => { clearTimeout(timer); ws.off('message', listener); };
  ws.on('message', listener);
});

test('hosts, discovers, joins, and relays a nearby hall', async () => {
  const host = await connect(), guest = await connect();
  host.send(JSON.stringify({ type: 'host', name: 'Ember Bastion', playerName: 'Azure Warden' }));
  const hosted = await next(host, 'hosting');
  guest.send(JSON.stringify({ type: 'list', playerName: 'Gilded Sentinel' }));
  const list = await next(guest, 'halls');
  assert.equal(list.halls[0].name, 'Ember Bastion');
  assert.equal(list.presence.online, 2);
  assert.ok(list.presence.names.includes('Azure Warden'));
  guest.send(JSON.stringify({ type: 'join', hallId: hosted.hall.id, playerName: 'Gilded Sentinel' }));
  await next(host, 'peer-joined');
  guest.send(JSON.stringify({ type: 'relay', payload: { kind: 'state', state: { turn: 1, marker: 'saved' } } }));
  assert.equal((await next(host, 'relay')).payload.state.marker, 'saved');

  const peerLeft = next(guest, 'peer-left');
  host.close();
  assert.equal((await peerLeft).canRejoin, true);

  const replacement = await connect();
  const rejoined = next(replacement, 'rejoined');
  const restored = next(replacement, 'relay');
  const peerRejoined = next(guest, 'peer-rejoined');
  replacement.send(JSON.stringify({ type: 'rejoin', hallId: hosted.hall.id, token: hosted.rejoinToken }));
  assert.equal((await rejoined).playerIndex, 0);
  assert.equal((await restored).payload.state.marker, 'saved');
  assert.equal((await peerRejoined).playerName, 'Azure Warden');
  replacement.close(); guest.close();
});

test('rejoining over a live seat does not emit a false disconnect', async () => {
  const host = await connect(), guest = await connect();
  host.send(JSON.stringify({ type: 'host', name: 'Storm Keep', playerName: 'Azure Rook' }));
  const hosted = await next(host, 'hosting');
  guest.send(JSON.stringify({ type: 'join', hallId: hosted.hall.id, playerName: 'Golden Guard' }));
  await next(host, 'peer-joined');

  const replacement = await connect();
  replacement.send(JSON.stringify({ type: 'rejoin', hallId: hosted.hall.id, token: hosted.rejoinToken }));
  await next(replacement, 'rejoined');
  await next(guest, 'peer-rejoined');
  await noMessage(guest, 'peer-left');

  replacement.close(); guest.close();
});

test('lists named available players and creates a duel with one challenge', async () => {
  const blue = await connect('192.0.2.10'), gold = await connect('192.0.2.10');
  blue.send(JSON.stringify({ type: 'list', playerName: 'Farzan' }));
  await next(blue, 'halls');
  gold.send(JSON.stringify({ type: 'list', playerName: 'Mira' }));
  const presence = await next(blue, 'halls');
  assert.deepEqual(new Set(presence.presence.players.map(player => player.name)), new Set(['Farzan', 'Mira']));
  const goldPlayer = presence.presence.players.find(player => player.name === 'Mira');
  assert.ok(goldPlayer?.id);

  const hosting = next(blue, 'hosting'), joined = next(gold, 'joined'), peerJoined = next(blue, 'peer-joined');
  blue.send(JSON.stringify({ type: 'challenge', playerId: goldPlayer.id }));
  assert.equal((await hosting).hall.guestName, 'Mira');
  assert.equal((await joined).playerIndex, 1);
  assert.equal((await peerJoined).guestName, 'Mira');
  blue.close(); gold.close();
});

test('invite code connects and restores players when proxy addresses differ', async () => {
  const host = await connect('198.51.100.10'), guest = await connect('2001:db8::20');
  host.send(JSON.stringify({ type: 'host', name: 'Split Network Keep', playerName: 'Azure Warden' }));
  const hosted = await next(host, 'hosting');
  assert.match(hosted.hall.code, /^[A-F0-9]{6}$/);

  guest.send(JSON.stringify({ type: 'list', playerName: 'Golden Paladin' }));
  assert.equal((await next(guest, 'halls')).halls.length, 0);
  guest.send(JSON.stringify({ type: 'join', code: hosted.hall.code.toLowerCase(), playerName: 'Golden Paladin' }));
  const joined = await next(guest, 'joined');
  assert.equal(joined.hall.id, hosted.hall.id);
  await next(host, 'peer-joined');

  const replacement = await connect('203.0.113.44');
  replacement.send(JSON.stringify({ type: 'rejoin', hallId: hosted.hall.id, token: joined.rejoinToken }));
  assert.equal((await next(replacement, 'rejoined')).playerIndex, 1);
  replacement.close(); host.close(); guest.close();
});

test('rejects valid JSON values that are not protocol messages', async () => {
  const socket = await connect();
  socket.send('null');
  assert.equal((await next(socket, 'error')).message, 'Invalid message.');
  socket.send('[]');
  assert.equal((await next(socket, 'error')).message, 'Invalid message.');
  socket.close();
});

test.after(() => new Promise(resolve => server.close(resolve)));
