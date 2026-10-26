import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

process.env.NODE_ENV = 'test';
const { server } = await import('./server.js');
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `ws://127.0.0.1:${server.address().port}`;
const connect = (address = '') => new Promise(resolve => { const ws = new WebSocket(url, address ? { headers: { 'x-forwarded-for': address } } : undefined); ws.once('open', () => resolve(ws)); });
const next = (ws, type, predicate = () => true) => new Promise(resolve => { const listener = raw => { const value = JSON.parse(raw); if (value.type === type && predicate(value)) { ws.off('message', listener); resolve(value); } }; ws.on('message', listener); });
const noMessage = (ws, type, delay = 60) => new Promise((resolve, reject) => {
  const listener = raw => { const value = JSON.parse(raw); if (value.type === type && predicate(value)) { cleanup(); reject(new Error(`Unexpected ${type} message`)); } };
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

test('lists players across addresses and starts only after acceptance', async () => {
  const blue = await connect('192.0.2.10'), gold = await connect('2001:db8::10');
  blue.send(JSON.stringify({ type: 'list', playerName: 'Farzan' }));
  await next(blue, 'halls');
  gold.send(JSON.stringify({ type: 'list', playerName: 'Mira' }));
  const presence = await next(blue, 'halls');
  assert.deepEqual(new Set(presence.presence.players.map(player => player.name)), new Set(['Farzan', 'Mira']));
  const goldPlayer = presence.presence.players.find(player => player.name === 'Mira');
  assert.ok(goldPlayer?.id);

  const request = next(gold, 'halls');
  blue.send(JSON.stringify({ type: 'challenge', playerId: goldPlayer.id }));
  const invite = (await request).invitations[0];
  assert.ok(invite);
  await noMessage(blue, 'hosting');
  const hosting = next(blue, 'joined'), joined = next(gold, 'hosting'), peerJoined = next(gold, 'peer-joined');
  gold.send(JSON.stringify({type:'accept', invitationId:invite.id}));
  assert.equal((await hosting).hall.guestName, 'Farzan');
  assert.equal((await joined).playerIndex, 0);
  assert.equal((await peerJoined).guestName, 'Farzan');
  blue.close(); gold.close();
});

test('invite code connects and restores players when proxy addresses differ', async () => {
  const host = await connect('198.51.100.10'), guest = await connect('2001:db8::20');
  host.send(JSON.stringify({ type: 'host', name: 'Split Network Keep', playerName: 'Azure Warden' }));
  const hosted = await next(host, 'hosting');
  assert.match(hosted.hall.code, /^[A-F0-9]{6}$/);

  guest.send(JSON.stringify({ type: 'list', playerName: 'Golden Paladin' }));
  assert.ok((await next(guest, 'halls')).halls.some(hall=>hall.id===hosted.hall.id));
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

test('concurrent invitations accept once and clear competing requests', async () => {
  const { invitations, clients } = await import('./server.js');
  const sockets = await Promise.all([connect(),connect(),connect()]);
  try {
    for (const [i, ws] of sockets.entries()) {
      ws.send(JSON.stringify({type:'list',playerName:`Player ${i}`}));
      await next(ws,'halls');
    }
    // Match each test socket to its server peer through a private identity response.
    const ids=[];
    for(const ws of sockets){const identity=next(ws,'halls');ws.send(JSON.stringify({type:'list'}));const list=await identity;ids.push(list.presence.players.find(p=>p.name===`Player ${ids.length}`).id)}
    for(const i of [0,2]) {const response=next(sockets[1],'halls');sockets[i].send(JSON.stringify({type:'challenge',playerId:ids[1]}));await response;}
    assert.equal([...invitations.values()].filter(v=>v.to===ids[1]).length,2);
    const chosen=[...invitations.values()].find(v=>v.from===ids[0]);
    const hosted=next(sockets[1],'hosting');
    sockets[1].send(JSON.stringify({type:'accept',invitationId:chosen.id}));
    await hosted;
    assert.equal([...invitations.values()].some(v=>v.from===ids[1]||v.to===ids[1]),false);
    const error=next(sockets[2],'error');
    sockets[2].send(JSON.stringify({type:'accept',invitationId:chosen.id}));
    assert.match((await error).message,/ended/);
  } finally {sockets.forEach(ws=>ws.close());}
});

test('expiry, cancellation, decline, and disconnect remove challenges', async () => {
 const { invitations }=await import('./server.js');
 const a=await connect(),b=await connect();
 try{
  a.send(JSON.stringify({type:'list',playerName:'Expiry A'}));await next(a,'halls');
  b.send(JSON.stringify({type:'list',playerName:'Expiry B'}));
  const list=await next(b,'halls',value=>value.presence.players.some(p=>p.name==='Expiry B')),id=list.presence.players.find(p=>p.name==='Expiry B').id;
  const challenge=async()=>{const response=next(b,'halls',value=>value.invitations.length>0);a.send(JSON.stringify({type:'challenge',playerId:id}));return (await response).invitations[0]};
  let invite=await challenge();
  let response=next(b,'halls');a.send(JSON.stringify({type:'cancel',invitationId:invite.id}));assert.equal((await response).invitations.length,0);
  invite=await challenge();response=next(a,'halls');b.send(JSON.stringify({type:'decline',invitationId:invite.id}));assert.equal((await response).invitations.length,0);
  invite=await challenge();invitations.get(invite.id).expiresAt=Date.now()-1;
  const error=next(b,'error');b.send(JSON.stringify({type:'accept',invitationId:invite.id}));assert.match((await error).message,/ended/);
  invite=await challenge();response=next(b,'halls');a.close();assert.equal((await response).invitations.length,0);
 }finally{a.close();b.close();}
});

test('private guest token restores identity and same name does not', async()=>{
 const a=await connect();let response=next(a,'identity');a.send(JSON.stringify({type:'list',playerName:'Same Name'}));const first=await response;
 const b=await connect();response=next(b,'identity');b.send(JSON.stringify({type:'list',playerName:'Same Name'}));const second=await response;assert.notEqual(first.clientId,second.clientId);
 a.close();
 const returning=await connect();response=next(returning,'identity');returning.send(JSON.stringify({type:'list',playerName:'Renamed',guestToken:first.guestToken}));assert.equal((await response).clientId,first.clientId);
 returning.close();b.close();
});
