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
- Publish the v31 static files.
- Decadence Inc navigation depends on that domain's TLS certificate being corrected.
