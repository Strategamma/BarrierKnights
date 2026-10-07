# Relevant Blockers

- Opening `index.html` through `file://` does not permit service-worker registration, so PWA cache updates and true offline behavior cannot be verified in that mode. Serve the project over HTTP(S) for PWA testing.
- The Codex in-app browser currently exposes no inspectable tab for this file page, and the local Playwright browser binary is unavailable. Automated logic/static checks work, but live responsive screenshots and console inspection require an accessible browser runtime.
