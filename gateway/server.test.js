import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

process.env.NODE_ENV = 'test';
const { server } = await import('./server.js');
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `ws://127.0.0.1:${server.address().port}`;
const connect = () => new Promise(resolve => { const ws = new WebSocket(url); ws.once('open', () => resolve(ws)); });
const next = (ws, type) => new Promise(resolve => { const listener = raw => { const value = JSON.parse(raw); if (value.type === type) { ws.off('message', listener); resolve(value); } }; ws.on('message', listener); });

test('hosts, discovers, joins, and relays a nearby hall', async () => {
  const host = await connect(), guest = await connect();
  host.send(JSON.stringify({ type: 'host', name: 'Ember Bastion', playerName: 'Azure Warden' }));
  const hosted = await next(host, 'hosting');
  guest.send(JSON.stringify({ type: 'list' }));
  const list = await next(guest, 'halls');
  assert.equal(list.halls[0].name, 'Ember Bastion');
  guest.send(JSON.stringify({ type: 'join', hallId: hosted.hall.id, playerName: 'Gilded Sentinel' }));
  await next(host, 'peer-joined');
  guest.send(JSON.stringify({ type: 'relay', payload: { kind: 'ready' } }));
  assert.deepEqual((await next(host, 'relay')).payload, { kind: 'ready' });
  host.close(); guest.close();
});

test.after(() => new Promise(resolve => server.close(resolve)));
