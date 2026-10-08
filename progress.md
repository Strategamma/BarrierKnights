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
