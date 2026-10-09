Original prompt: Audit all game navigation, pages, popups, and tooltips; connect navigation to Decadence Inc; modernize and animate the lobby; explain Wi-Fi play and show the current network and connected players.

Completed:
- Added Decadence Inc navigation from setup, gameplay, and victory.
- Simplified setup labels, rules, action help, victory actions, and all lobby back routes.
- Added an animated Nearby Wi-Fi status card, setup instructions, live player count/names, and a reduced-motion fallback.
- Restored the two-player confirmation lobby: both names/colors appear and the host explicitly starts.
- Gateway now broadcasts privacy-scoped Barrier Knights presence for the same network group.
- Bumped PWA cache to v31.

Verification:
- Client smoke suite passes.
- Gateway integration suite passes (3/3).
- JavaScript syntax and diff whitespace checks pass; PROJECT.md is 480 words.
- Browser screenshot check could not run because the host has no Playwright Chromium executable installed.

TODO:
- Redeploy the Render gateway for presence metadata to reach production.
- Publish the v32 static files.
- Decadence Inc navigation depends on that domain's TLS certificate being corrected.

2026-10-09 multiplayer feedback update:
- Synchronized opponent card reveals using a monotonic card event number, including Break the Wall draws.
- Added shared Wi-Fi move history on desktop and mobile.
- Remote winners now trigger the same victory dialog and confetti.
- Added mutual rematch requests; only the host creates the fresh synchronized board after both players accept.
- Client smoke and gateway integration suites pass. PWA cache is v32.
- History rendering uses text nodes so synchronized peer text cannot inject markup.
- Portrait Wi-Fi board sizing now reserves space for the collapsed history control; compact landscape history overlays from the top.
- Playwright screenshot QA was attempted again but the Chromium executable is not installed on this host.

2026-10-09 action clarity update:
- Move, Wall, and Card now use distinct cyan/amber/violet treatments and clear icons on desktop and mobile.
- Added a first-run bouncing “Try me” cue on Move; any action selection dismisses and remembers it.
- Card popups use semantic backgrounds for Blank, +2 Moves, +2 Walls, and Break the Wall.
- Strengthened Decadence gold/cyan hierarchy across setup, duel, create/start, wall confirmation, install, and rematch actions.
- PWA cache bumped to v33.
- Client smoke passed 3/3, gateway tests passed 3/3, and syntax/diff checks passed. Playwright still cannot launch because its Chromium executable is absent.

2026-10-10 Decadence/lobby reliability update:
- Restyled setup and lobby surfaces with Decadence Arcade's warm near-black, amber/crimson palette, bold headings, square controls, and offset-shadow interactions while preserving the blue/gold game board.
- Added a short reduced-motion-safe Decadence → Barrier Knights handoff for decadenceinc.com referrals and `?from=decadence` links.
- Hosts now receive a six-character lobby code; guests can enter it when auto-discovery is split by VPN, Private Relay, IPv4/IPv6, or proxy routing.
- Rejoin remains protected by the private seat token and no longer fails solely because the routed address changed.
- Client smoke passes, including code normalization/submission and host-code display. Gateway integration passes 4/4, including cross-address join and rejoin. Syntax and whitespace checks pass.
- Browser QA remains blocked: Chromium installs but macOS denies its process registration; the in-app browser cannot access localhost because browser permission was declined.
- TODO: redeploy the gateway before publishing the v34 client, because code joining requires both protocol sides.

2026-10-10 named-player duel update:
- Nearby Wi-Fi now asks for a player name once, saves it locally, and registers only after naming.
- Available named players broadcast immediately inside the network group. Tapping Duel directly seats both clients and the Blue initiator automatically starts the synchronized match.
- Added Change my name without exposing the generated-name or lobby-code flow.
- Confirmed perspective rules in regression coverage: Blue rotates canvas and input; Gold remains canonical; each local player and controls stay below.
- Added an audio-unlocked two-note chime when a remote action returns the turn to the local player; initial match entry and opponent turns stay silent.
- PWA cache bumped to v35. Gateway redeployment is required before publishing this client.
- Verification passes: client smoke covers saved naming, live discovery, one-tap challenge/start, exactly one returning-turn alert, Blue rotated input, Gold canonical input, and existing gameplay; gateway integration passes 5/5. Playwright remains blocked by macOS Mach-port permission denial.
