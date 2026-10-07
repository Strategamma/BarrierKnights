# Barrier Knights

Browser-only two-player 9×9 strategy game, built with HTML, CSS, and vanilla JavaScript on a canvas. Players begin with 10 complete walls and win by reaching the far end row. A wall spans two board edges; legal placement must leave both players a path to their goal. Cards are drawn as an action, activate immediately, cannot be held, and discarded cards do not reshuffle. The supplied blue/gold canvas UI is the visual baseline.

Mobile is first-class: the board stays square and visible, controls are touch-sized, and wall placement cannot depend on hover. Pass-and-play controls sit on opposite sides; the far side rotates toward that player. +2 Moves consumes the draw action, then grants exactly two more actions.

Touch wall placement is preview-first: tap or drag to snap a ghost wall to the nearest grid boundary, then explicitly confirm or cancel. Desktop mouse placement remains hover-and-click. Mobile exposes Undo; in bot mode it reverses the completed human+bot round so control safely returns to Blue.

The game is an offline-capable PWA and must remain Android-packageable from the same web code.

Game modes are Couch Siege (offline same device), Realm Link (two nearby devices), and Clockwork Duel (offline bot). Realm Link uses a Render WebSocket gateway at `gateway.decadenceinc.com`: clients sharing the forwarded public address discover named halls, join explicitly, receive generated identities and Blue/Gold assignments, and exchange authoritative snapshots. Each device shows its knight nearest the bottom with only its controls below; Blue rotates local rendering and pointer coordinates without changing canonical state. The rival appears above and card reveals overlay the board. The gateway is in `gateway/`; `render.yaml` deploys it. Shared carrier NAT may expose unrelated halls, so joining is never automatic.

In bot mode the human is Gold at row 8 and the Blue bot is at row 0. Each player stores a `goalRow`, used throughout pathfinding, win detection, bot evaluation, rendering, and diagnostics. Squire/Knight/Champion all use shared legality/pathfinding without hidden advantages.

Two pickups stay active in the central five rows, excluding starting column 4. Landing collects it freely: Supply Cache grants a wall, Momentum an action, and Fortune a free card. Pickups respawn after two complete turns; timers are undoable and bots value reachable pickups.

Pawns may move onto the same square but may not jump over one another. When stacked, both pawns remain visibly offset within the square.

Branding uses cached `assets/barrier-knights-logo.svg` with a styled text fallback.

Presentation effects are code-native and non-blocking: requestAnimationFrame handles pawn interpolation and canvas pickup/wall impacts; CSS handles selected actions, turn emphasis, card/setup/victory transitions, and confetti. `prefers-reduced-motion` suppresses decorative motion. Logical state remains authoritative throughout animation.

Mobile sizing uses a CSS `--viewport-height` refreshed from the Visual Viewport API so browser chrome, orientation changes, and zoom constrain the board without hiding controls.

Portrait mobile action buttons use 48px touch targets; compact landscape retains 42px targets. Board height budgets account for these controls, preferring to reduce the board on unusually short viewports instead of clipping taps.
