# Barrier Knights

Browser-only two-player 9×9 canvas strategy game using HTML, CSS, and vanilla JavaScript. Players begin with 10 walls and win by reaching the far row. A wall spans two edges; placement must preserve both paths. Cards activate immediately as an action, cannot be held, and do not reshuffle. Blue/gold is the visual baseline.

Mobile is first-class: the board stays square and visible, controls are touch-sized, and wall placement cannot depend on hover. Pass-and-play controls sit on opposite sides; the far side rotates toward that player. +2 Moves consumes the draw action, then grants exactly two more actions.

Touch wall placement is preview-first: tap or drag to snap a ghost wall, then confirm or cancel. Board actions commit on `pointerdown`, with deduplicated `click` fallback; pointer movement only previews. Mobile exposes Undo; bot undo restores the round.

The game is an offline-capable PWA with SVG plus 192/512px PNG install icons and a 180px Apple icon. It must remain Android-packageable from the same web code.

Modes are same screen, Nearby Wi-Fi, and bot. Wi-Fi asks for a saved name, then shows available named clients grouped by forwarded address; one-tap Duel seats both players and starts automatically. Browsers cannot expose the SSID/device list. Private seat tokens authorize 15-minute reconnection across address changes. Turns, cards, history, victory, and rematches synchronize. Each device puts itself below: Blue rotates rendering/input; Gold stays canonical. Returning local turns chime after audio unlock. Gateway: `wss://barrierknights.onrender.com`.

In bot mode the human is Gold at row 8 and the Blue bot is at row 0. Each player stores a `goalRow`, used throughout pathfinding, win detection, bot evaluation, rendering, and diagnostics. Squire/Knight/Champion all use shared legality/pathfinding without hidden advantages.

Two pickups stay active in the central five rows, excluding starting column 4. Landing collects it freely: Supply Cache grants a wall, Momentum an action, and Fortune a free card. Pickups respawn after two complete turns; timers are undoable and bots value reachable pickups.

Pawns may move onto the same square but may not jump over one another. When stacked, both pawns remain visibly offset within the square.

Branding uses cached `assets/barrier-knights-logo.svg`, a text fallback, and navigation to Decadence Inc. Setup adapts Decadence's warm amber/crimson, offset-shadow controls; referred or `?from=decadence` visits get a reduced-motion-safe branded handoff.

Presentation uses cyan Move, amber Wall, violet Card, and gold primary controls. Button variants target WCAG AA with explicit focus/disabled states. How to Play is a four-step responsive visual modal. Overlays remember their caller; returning from Modes preserves the game, live connection, bot scheduling, or victory dialog. Effects are code-native and reduced-motion safe. Logical state remains authoritative.

Mobile sizing uses a CSS `--viewport-height` refreshed from the Visual Viewport API so browser chrome, orientation changes, and zoom constrain the board without hiding controls.

Portrait mobile action buttons use 48px touch targets; compact landscape retains 42px targets. Board height budgets account for these controls, preferring to reduce the board on unusually short viewports instead of clipping taps.
