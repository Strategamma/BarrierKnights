# Relevant Blockers

- Opening `index.html` through `file://` does not permit service-worker registration, so PWA cache updates and true offline behavior cannot be verified in that mode. Serve the project over HTTP(S) for PWA testing.
- The Codex in-app browser currently exposes no inspectable tab for this file page, and the local Playwright browser binary is unavailable. Automated logic/static checks work, but live responsive screenshots and console inspection require an accessible browser runtime.
- Release audit on 2026-10-08 found `https://barrier-knights-gateway.onrender.com/` and its WebSocket upgrade returning HTTP 404. Confirm the actual Render service hostname/deployment before publishing Nearby Wi-Fi.
- Release audit on 2026-10-08 found `decadenceinc.com` and `www.decadenceinc.com` serving a GitHub Pages certificate that does not include either custom hostname. Fix the GitHub Pages custom-domain/DNS certificate before PWA publication.
- The active writable workspace is `/Users/farzan/Documents/Codex/Barrier Knights`, but the intended GitHub Desktop repository is `/Users/farzan/Documents/Codex/BarrierKnights`. The audited changes must be synchronized into the no-space repository before committing or publishing.
