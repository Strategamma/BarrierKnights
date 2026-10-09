const fs = require('fs');
const vm = require('vm');

function element(extra = {}) {
  const classes = new Set();
  return Object.assign({
    textContent: '', innerHTML: '', hidden: false, disabled: false, dataset: {}, style: { setProperty(name, value) { this[name] = value; } },
    classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) },
    children: [], append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); },
  }, extra);
}

const ctx = new Proxy({}, { get: (target, key) => target[key] || (() => {}) });
let canvasRect = { left: 0, top: 0, width: 648, height: 648 };
const canvas = element({ width: 648, height: 648, getContext: () => ctx, getBoundingClientRect: () => canvasRect });
const ids = Object.fromEntries(['game','turn','player0','player1','botStatusName','rivalName','rivalDetail','skip','mobileSkip','mobileNewGame','mobileUndo','wallConfirmBar','confirmWall','cancelWall','undo','history','sharedHistory','sharedHistoryContent','message','cardResult','cardName','cardText','victory','confetti','winner','victoryStatus','again','victoryModes','startFog','fogMatchup','modePicker','modeLabel','difficultyDescription','localMode','wifiMode','botMode','reset','realmPanel','realmChoices','realmBrowser','realmLobby','realmStatus','networkCount','networkPeople','hallList','createEmptyRealm','realmBrowserBack','lobbyBlueName','lobbyGoldName','lobbyStatus','startRealmGame','leaveRealmLobby','closeRealm','installApp','arcadeHandoff','playerNameForm','playerName','savePlayerName'].map(id => [id, element()]));
const moveButtons = [element({ dataset: { action: 'move' } }), element({ dataset: { action: 'move' } })];
const wallButtons = [element({ dataset: { action: 'wall' } }), element({ dataset: { action: 'wall' } })];
const cardButtons = [element({ dataset: { action: 'card' } }), element({ dataset: { action: 'card' } })];
const difficultyButtons = ['squire','knight','champion'].map(difficulty => element({ dataset: { difficulty } }));
const seats = [element({ dataset: { player: '0' } }), element({ dataset: { player: '1' } })];
const groups = {
  '[data-action="move"]': moveButtons, '[data-action="wall"]': wallButtons, '[data-action="card"]': cardButtons,
  '[data-action]': [...moveButtons, ...wallButtons, ...cardButtons], '.mobile-seat': seats,
  '[data-difficulty]': difficultyButtons,
  '[data-walls="0"]': [element(), element()], '[data-walls="1"]': [element(), element(), element()],
  '[data-deck-count]': [element(), element(), element(), element()], '[data-actions-label]': [element(), element()],
};
const aliases = { '#board': canvas, '#player0 > b': element(), '#player1 > b': element(), '.mobile-seat[data-player="0"] .seat-row > b': element(), '.mobile-seat[data-player="1"] .seat-row > b': element(), '.rival-status': element(), '.lobby-players': element() };
const document = {
  body: element(), documentElement: element({ requestFullscreen() {} }), fullscreenElement: null,
  querySelector(q) { return q.startsWith('#') ? ids[q.slice(1)] || aliases[q] : aliases[q] || element(); },
  querySelectorAll(q) { return groups[q] || []; }, createElement() { return element(); }, exitFullscreen() {},
};
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const instrumentedScript = script.replace(/\}\)\(\);\s*$/, 'window.__botTest={getState:()=>state,chooseBotDecision,drawCard,legalWall,hasPath,validRealmState,render,setRealmPlayerIndex:value=>{realmPlayerIndex=value}};})();');
class FakeWebSocket {
  static instances = [];
  constructor(url) { this.url = url; this.readyState = 1; this.sent = []; FakeWebSocket.instances.push(this); }
  send(value) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState = 3; }
}
const stored = new Map();
const localStorage = { getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) };
class FakeAudioContext { constructor() { this.currentTime = 0; this.destination = {}; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } createOscillator() { return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } }
const sandbox = { document, navigator: {}, console, Math, JSON, WebSocket: FakeWebSocket, AudioContext: FakeAudioContext, localStorage, clearTimeout() {}, addEventListener() {}, setTimeout: fn => { fn(); return 1; } };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(instrumentedScript, sandbox);

if (!moveButtons.every(button => button.children.some(child => child.textContent === 'Try me'))) throw new Error('First-time Move buttons did not receive the Try me helper');
ids.localMode.onclick();
let state = JSON.parse(sandbox.window.render_game_to_text());
if (state.gameMode !== 'local' || state.deckRemaining !== 13 || !ids.modePicker.hidden) throw new Error('Local game did not initialize from the mode picker');
if (state.pickups.length !== 2 || state.pickups.some(p => p.y < 2 || p.y > 6 || p.x === 4)) throw new Error('Initial pickups spawned outside legal central cells');
canvas.onclick({ clientX: 324, clientY: 108 });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.players[0].position.y !== 1) throw new Error('Click fallback did not move the active knight');
ids.localMode.onclick();
wallButtons[0].onclick();
if (stored.get('barrierKnightsActionHintSeen') !== '1') throw new Error('Action helper dismissal was not saved');
canvas.onpointerdown({ clientX: 144, clientY: 144, pointerType: 'touch' });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.walls.length || !state.wallPreview || ids.wallConfirmBar.hidden) throw new Error('Touch wall preview placed immediately or did not arm');
ids.confirmWall.onclick();
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.walls.length !== 1 || state.players[0].walls !== 9 || state.turn !== 'Gold Knight') throw new Error('Touch wall confirmation failed');
ids.mobileUndo.onclick();
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.walls.length || state.players[0].walls !== 10 || state.turn !== 'Blue Knight') throw new Error('Mobile undo did not restore wall placement');
canvas.onpointerdown({ clientX: 216, clientY: 216, pointerType: 'touch' });
ids.cancelWall.onclick();
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.walls.length || state.wallPreview || !ids.wallConfirmBar.hidden) throw new Error('Touch wall preview cancellation failed');
moveButtons[0].onclick();
canvas.onpointerdown({ clientX: 324, clientY: 108, pointerType: 'mouse' });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.turn !== 'Gold Knight' || state.players[0].position.y !== 1) throw new Error('Local movement/turn failed');

ids.localMode.onclick();
canvasRect = { left: 50, top: 30, width: 324, height: 324 };
canvas.onpointerdown({ clientX: 212, clientY: 84, pointerType: 'mouse' });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.turn !== 'Gold Knight' || state.players[0].position.y !== 1) throw new Error('Movement failed on a scaled or offset board');
canvasRect = { left: 0, top: 0, width: 648, height: 648 };

ids.localMode.onclick();
const cardState = sandbox.__botTest.getState();
cardState.pickups = [];
cardState.deck = ['moves'];
sandbox.__botTest.drawCard();
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.actionsRemaining !== 2 || state.turn !== 'Blue Knight' || state.deckRemaining !== 0) throw new Error('+2 Moves did not spend the draw and grant exactly two actions');
if (!ids.cardResult.classList.contains('card-moves')) throw new Error('+2 Moves card did not use its movement color theme');

ids.localMode.onclick();
const wallCardState = sandbox.__botTest.getState();
wallCardState.pickups = [];
wallCardState.deck = ['walls'];
sandbox.__botTest.drawCard();
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.players[0].walls !== 12 || state.turn !== 'Gold Knight') throw new Error('+2 Walls card did not grant two complete walls');
if (!ids.cardResult.classList.contains('card-walls')) throw new Error('+2 Walls card did not use its wall color theme');

ids.localMode.onclick();
const blankCardState = sandbox.__botTest.getState();
blankCardState.pickups = [];
blankCardState.deck = ['blank'];
sandbox.__botTest.drawCard();
if (!ids.cardResult.classList.contains('card-blank')) throw new Error('Blank card did not use its neutral color theme');

ids.localMode.onclick();
const breakState = sandbox.__botTest.getState();
breakState.pickups = [];
breakState.deck = ['break'];
sandbox.__botTest.drawCard();
state = JSON.parse(sandbox.window.render_game_to_text());
if (!state.pendingBreak || ids.mobileSkip.hidden) throw new Error('Break the Wall did not enter its required resolution state');
if (!ids.cardResult.classList.contains('card-break')) throw new Error('Break the Wall card did not use its danger color theme');
ids.mobileSkip.onclick();
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.pendingBreak || state.turn !== 'Gold Knight') throw new Error('Break the Wall skip did not complete the action');

ids.localMode.onclick();
const winningState = sandbox.__botTest.getState();
winningState.pickups = [];
winningState.players[0].position = { x: 4, y: 7 };
canvas.onpointerdown({ clientX: 324, clientY: 612, pointerType: 'mouse' });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.winner !== 'Blue Knight' || !ids.victory.classList.contains('show')) throw new Error('Reaching the goal row did not declare and display the winner');

ids.localMode.onclick();
const blockedState = sandbox.__botTest.getState();
blockedState.walls = [
  { x: 0, y: 0, dir: 'h', owner: 0 },
  { x: 2, y: 0, dir: 'h', owner: 0 },
  { x: 4, y: 0, dir: 'h', owner: 0 },
  { x: 6, y: 0, dir: 'h', owner: 0 },
  { x: 7, y: 0, dir: 'h', owner: 0 },
];
if (sandbox.__botTest.hasPath(0, blockedState.walls)) throw new Error('Pathfinding failed to detect a complete blockade');

ids.localMode.onclick();
state = JSON.parse(sandbox.window.render_game_to_text());
const targetPickup = [...state.pickups].sort((a, b) => (a.y + Math.abs(a.x - 4)) - (b.y + Math.abs(b.x - 4)))[0];
for (let step = 0; step < 30 && state.pickups.some(p => p.x === targetPickup.x && p.y === targetPickup.y); step++) {
  const isBlue = state.turn === 'Blue Knight';
  const otherPickups = state.pickups.filter(p => p.x !== targetPickup.x || p.y !== targetPickup.y);
  let choices = state.legalMoves.filter(p => !otherPickups.some(o => o.x === p.x && o.y === p.y));
  if (!choices.length) choices = state.legalMoves;
  choices.sort((a, b) => isBlue
    ? (Math.abs(a.x - targetPickup.x) + Math.abs(a.y - targetPickup.y)) - (Math.abs(b.x - targetPickup.x) + Math.abs(b.y - targetPickup.y))
    : b.y - a.y);
  const next = choices[0];
  canvas.onpointerdown({ clientX: next.x * 72 + 36, clientY: next.y * 72 + 36, pointerType: 'mouse' });
  state = JSON.parse(sandbox.window.render_game_to_text());
}
if (state.pickups.some(p => p.x === targetPickup.x && p.y === targetPickup.y) || state.pickupRespawns.length !== 1) throw new Error('Pickup was not collected or queued for respawn');
if (targetPickup.type === 'supply' && state.players[0].walls !== 11) throw new Error('Supply Cache did not grant a wall');
if (targetPickup.type === 'momentum' && state.turn !== 'Blue Knight') throw new Error('Momentum did not grant an additional action');
if (targetPickup.type === 'fortune' && state.deckRemaining !== 12) throw new Error('Fortune did not draw a card');
ids.mobileUndo.onclick();
state = JSON.parse(sandbox.window.render_game_to_text());
if (!state.pickups.some(p => p.x === targetPickup.x && p.y === targetPickup.y) || state.pickupRespawns.length) throw new Error('Undo did not restore the collected pickup');

ids.localMode.onclick();
for (const y of [1, 7, 2, 6, 3, 5, 4]) canvas.onpointerdown({ clientX: 324, clientY: y * 72 + 36, pointerType: 'mouse' });
state = JSON.parse(sandbox.window.render_game_to_text());
canvas.onpointerdown({ clientX: 324, clientY: 4 * 72 + 36, pointerType: 'mouse' });
const collisionState = JSON.parse(sandbox.window.render_game_to_text());
if (collisionState.players[1].position.y !== 4 || collisionState.turn !== 'Blue Knight') throw new Error('Pawns could not share an occupied square');

for (const [index, difficulty] of ['squire','knight','champion'].entries()) {
  difficultyButtons[index].onclick();
  ids.botMode.onclick();
  state = JSON.parse(sandbox.window.render_game_to_text());
  if (state.botDifficulty !== difficulty) throw new Error(`${difficulty} selection did not persist into bot game`);
  if (state.players[0].name !== 'Gold Knight' || state.players[0].position.y !== 8 || state.players[0].goalRow !== 0) throw new Error(`${difficulty} bot game did not put the human Gold player at the bottom`);
  if (state.players[1].name !== 'Blue Bot' || state.players[1].position.y !== 0 || state.players[1].goalRow !== 8) throw new Error(`${difficulty} bot game did not put the Blue bot at the top`);
  canvas.onpointerdown({ clientX: 324, clientY: 540, pointerType: 'mouse' });
  state = JSON.parse(sandbox.window.render_game_to_text());
  if (state.turn !== 'Gold Knight' || !state.lastBotDecision || !['move','wall','card','break'].includes(state.lastBotDecision.type)) throw new Error(`${difficulty} bot did not make a diagnosed legal response`);
}
difficultyButtons[2].onclick();
if (ids.difficultyDescription.textContent !== 'The computer plans ahead and uses stronger wall tactics.' || difficultyButtons[2].ariaPressed !== 'true') throw new Error('Hard difficulty selection UI failed');
const botActed = state.players[1].position.y > 0 || state.deckRemaining < 13 || state.walls.length > 0;
if (state.gameMode !== 'bot' || state.botDifficulty !== 'champion' || state.turn !== 'Gold Knight' || !botActed || !ids.modePicker.hidden) throw new Error('Champion bot mode did not initialize or answer the human move');
ids.mobileUndo.onclick();
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.turn !== 'Gold Knight' || state.players[0].position.y !== 8 || state.players[1].position.y !== 0 || state.walls.length || state.deckRemaining !== 13) throw new Error('Bot-round undo did not restore the round');
const internalState = sandbox.__botTest.getState();
internalState.botDifficulty = 'champion';
internalState.turn = 1;
internalState.walls = [];
internalState.players[0].position = { x: 0, y: 8 };
internalState.players[1].position = { x: 4, y: 7 };
let decision = sandbox.__botTest.chooseBotDecision();
if (decision.type !== 'move' || decision.move.position.y !== 8 || decision.reason !== 'taking the winning square') throw new Error('Champion did not prioritize an immediate win');
internalState.players[0].position = { x: 4, y: 1 };
internalState.players[1].position = { x: 4, y: 0 };
decision = sandbox.__botTest.chooseBotDecision();
if (decision.type !== 'wall' || decision.reason !== 'blocking an imminent Gold win') throw new Error('Champion did not block an imminent loss');

ids.wifiMode.onclick();
if (ids.realmPanel.hidden || ids.realmChoices.hidden) throw new Error('Nearby Wi-Fi did not request a player name before discovery');
ids.playerName.value = 'Farzan';
ids.playerName.oninput();
ids.playerNameForm.onsubmit({ preventDefault() {} });
if (stored.get('barrierKnightsPlayerName') !== 'Farzan' || ids.realmBrowser.hidden) throw new Error('Player name was not saved before discovery');
let socket = FakeWebSocket.instances.at(-1);
socket.onopen();
if (socket.sent.at(-1).type !== 'list' || !socket.sent.at(-1).playerName) throw new Error('Nearby Wi-Fi did not request the current games list with its identity');
socket.onmessage({ data: JSON.stringify({ type: 'welcome', clientId: 'self-player' }) });
socket.onmessage({ data: JSON.stringify({ type: 'halls', halls: [], presence: { online: 2, names: ['Farzan', 'Mira'], players: [{ id: 'self-player', name: 'Farzan' }, { id: 'mira-player', name: 'Mira' }] } }) });
if (ids.networkCount.textContent !== '2 players online' || ids.networkPeople.textContent !== '1 ready to duel') throw new Error('Nearby Wi-Fi did not show available named players');
const duelButton = ids.hallList.children.at(-1).children.at(-1);
if (duelButton.textContent !== '⚔ Duel' || duelButton.disabled) throw new Error('Online player did not show an active Duel action');
duelButton.onclick();
if (socket.sent.at(-1).type !== 'challenge' || socket.sent.at(-1).playerId !== 'mira-player') throw new Error('Duel did not challenge the selected named player');
socket.onmessage({ data: JSON.stringify({ type: 'hosting', hall: { id: 'hall-1', name: 'Nearby Duel', guestName: 'Mira' }, playerIndex: 0, rejoinToken: 'private-blue-token' }) });
socket.onmessage({ data: JSON.stringify({ type: 'peer-joined', guestName: 'Mira' }) });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.gameMode !== 'wifi' || state.realmPlayerIndex !== 0 || state.players[1].name !== 'Mira' || socket.sent.at(-1).payload?.kind !== 'state') throw new Error('One-tap duel did not begin and synchronize a Wi-Fi match');
if (ids.fogMatchup.textContent !== `${state.players[0].name} vs Mira`) throw new Error('Fog-clearing duel intro did not show both player names');
if (!document.body.classList.contains('realm-blue') || state.perspective !== 'blue-rotated-local-bottom' || ids.rivalName.textContent !== 'Rival · Mira') throw new Error('Blue host perspective was not rotated local-player-first');
canvas.onpointerdown({ clientX: 324, clientY: 540, pointerType: 'mouse' });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.players[0].position.y !== 1 || state.turn !== 'Mira') throw new Error('Rotated Blue perspective did not map bottom-side input to the canonical board');
const liveWifiState = sandbox.__botTest.getState();
liveWifiState.turn = 0;
cardButtons[0].onclick();
if (ids.cardResult.style['--card-x'] !== '324px' || ids.cardResult.style['--card-y'] !== '324px') throw new Error('Card result was not centered over the board');
const remote = JSON.parse(JSON.stringify(socket.sent.at(-1).payload.state));
remote.turn = 1;
socket.onmessage({ data: JSON.stringify({ type: 'relay', payload: { kind: 'state', state: remote } }) });
if (!moveButtons.every(button => button.disabled)) throw new Error('Realm Link did not lock controls during the remote knight turn');
remote.lastCard = 'walls';
remote.lastCardFree = false;
remote.cardEvent = (remote.cardEvent || 0) + 1;
remote.history.unshift('Mira drew +2 Walls.');
socket.onmessage({ data: JSON.stringify({ type: 'relay', payload: { kind: 'state', state: remote } }) });
if (ids.cardName.textContent !== '+2 Walls' || !ids.cardText.textContent.includes('walls')) throw new Error('Opponent card draw did not display on the local device');
if (!ids.sharedHistoryContent.children.some(row => row.textContent === 'Mira drew +2 Walls.')) throw new Error('Wi-Fi move history did not show the opponent action');
remote.turn = 0;
socket.onmessage({ data: JSON.stringify({ type: 'relay', payload: { kind: 'state', state: remote } }) });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.turnAlerts !== 1 || state.turn !== 'Farzan') throw new Error('Returning control to the local player did not sound one turn alert');
remote.turn = 1;
remote.winner = 1;
remote.history.unshift('Mira wins.');
socket.onmessage({ data: JSON.stringify({ type: 'relay', payload: { kind: 'state', state: remote } }) });
if (!ids.victory.classList.contains('show') || ids.winner.textContent !== 'Mira wins!' || ids.again.textContent !== 'Request rematch') throw new Error('Remote victory did not show the victory and rematch UI');
ids.again.onclick();
if (socket.sent.at(-1).payload?.kind !== 'rematch-request' || !ids.again.disabled) throw new Error('Rematch request was not relayed or locked while waiting');
socket.onmessage({ data: JSON.stringify({ type: 'relay', payload: { kind: 'rematch-request' } }) });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.winner !== null || ids.victory.classList.contains('show') || socket.sent.at(-1).payload?.rematch !== true) throw new Error('Mutually accepted rematch did not reset and synchronize the game');
const beforeMalformedRelay = sandbox.window.render_game_to_text();
socket.onmessage({ data: JSON.stringify({ type: 'relay', payload: { kind: 'state', state: { gameMode: 'wifi' } } }) });
if (sandbox.window.render_game_to_text() !== beforeMalformedRelay) throw new Error('Malformed Realm Link state was applied');
socket.onclose();
const reconnectingSocket = FakeWebSocket.instances.at(-1);
reconnectingSocket.onopen();
if (reconnectingSocket.sent.at(-1).type !== 'rejoin' || reconnectingSocket.sent.at(-1).token !== 'private-blue-token') throw new Error('Realm Link did not automatically reuse the private rejoin token');
reconnectingSocket.onmessage({ data: JSON.stringify({ type: 'rejoined', hall: { id: 'hall-1', name: 'Ember Bastion' }, playerIndex: 0, playerName: state.players[0].name, rejoinToken: 'private-blue-token', waitingForPeer: false }) });
reconnectingSocket.onmessage({ data: JSON.stringify({ type: 'relay', payload: { kind: 'state', state: remote } }) });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.gameMode !== 'wifi' || state.realmPlayerIndex !== 0 || !document.body.classList.contains('realm-blue')) throw new Error('Realm Link did not restore the saved player seat and board state');

const goldState = sandbox.__botTest.getState();
goldState.winner = null; goldState.turn = 1; goldState.mode = 'move'; goldState.pendingBreak = false; goldState.walls = []; goldState.players[0].position = { x: 4, y: 0 }; goldState.players[1].position = { x: 4, y: 8 };
sandbox.__botTest.setRealmPlayerIndex(1); sandbox.__botTest.render();
state = JSON.parse(sandbox.window.render_game_to_text());
if (!document.body.classList.contains('realm-gold') || document.body.classList.contains('realm-blue') || state.perspective !== 'gold-local-bottom') throw new Error('Gold guest perspective did not remain local-player-first');
canvas.onpointerdown({ clientX: 324, clientY: 540, pointerType: 'mouse' });
state = JSON.parse(sandbox.window.render_game_to_text());
if (state.players[1].position.y !== 7) throw new Error('Gold local-bottom perspective did not map board input correctly');

console.log('Smoke test passed: name/discovery/challenge, turn alert, both Wi-Fi perspectives, gameplay, bot response, and synchronization');
