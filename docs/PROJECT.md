# Barrier Knights

Publish from sibling `BarrierKnights`, the connected checkout.

Browser-only two-player 9×9 canvas strategy game using HTML, CSS, and vanilla JavaScript. Players begin with 10 walls and win by reaching the far row. A wall spans two edges; placement must preserve both paths. Cards activate immediately as an action, cannot be held, and do not reshuffle. Blue/gold is the visual baseline.

Mobile is first-class: the board stays square and visible, controls are touch-sized, and wall placement cannot depend on hover. Pass-and-play controls sit on opposite sides; the far side rotates toward that player. +2 Moves consumes the draw action, then grants exactly two more actions.

Touch walls: tap/drag a preview, then confirm/cancel. Board actions commit on `pointerdown`, with deduplicated `click` fallback; pointer movement only previews. Header: Back, Undo, scrollable History popup. Install stays home. Bot undo restores the round. First Move/Wall/Card interaction dismisses the hint.

Offline-capable PWA; homepage Install offers native prompt or browser instructions.

Modes: same screen, Play Online (default home), bot (difficulty shown after selection). Incoming player cards use crimson fill and accept by card or button; actions span the card width. Opening name popup precedes the hall; a header pencil opens Save/Cancel. Empty hall invites friends via native share, clipboard, or manual link copy. Global presence starts after name entry; Refresh/resume recheck availability. Always apply reconnect snapshots; distinguish offline/incompatible servers from empty halls. Server-owned 60-second invitations support accept/decline/cancel, concurrent challenges, and atomic seating. Private guest tokens restore identity; seat tokens permit 15-minute match recovery while gateway memory survives. Heartbeats detect disconnects. Cards use 4/3/2 desktop/tablet/phone columns. Blue rotates rendering/input; Gold stays canonical. Turns/cards/history/victory/rematches synchronize. Gateway: `wss://barrierknights.onrender.com`. Restarts erase sessions; persistent recovery is not implemented.

In bot mode the human is Gold at row 8 and the Blue bot is at row 0. Each player stores a `goalRow`, used throughout pathfinding, win detection, bot evaluation, rendering, and diagnostics. Squire/Knight/Champion all use shared legality/pathfinding without hidden advantages.

Two pickups stay active in the central five rows, excluding starting column 4. Landing collects it freely: Supply Cache grants a wall, Momentum an action, and Fortune a free card. Pickups respawn after two complete turns; timers are undoable and bots value reachable pickups.

Pawns may move onto the same square but may not jump over one another. When stacked, both pawns remain visibly offset within the square.

Branding uses `assets/barrier-knights-logo.svg`, a text fallback, and home-screen navigation to Decadence Inc. The game header returns to setup after native confirmation, preserving the current match. Setup adapts Decadence's warm amber/crimson, offset-shadow controls; referred or `?from=decadence` visits get a reduced-motion-safe branded handoff.

Presentation uses cyan Move, amber Wall, violet Card, and gold primary controls. Header Help opens the four-step guide. Bot setup uses header Back and green/yellow/red difficulty selections. Overlays remember their caller; returning from Modes preserves the game, live connection, bot scheduling, or victory dialog.

Mobile sizing uses a CSS `--viewport-height` refreshed from the Visual Viewport API so browser chrome, orientation changes, and zoom constrain the board without hiding controls.
