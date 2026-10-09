Goal: Make Nearby Wi-Fi feel immediate: named players appear quickly, one tap starts a duel, both perspectives remain local-player-first, and turns produce an audible alert.

Scope: Saved player-name entry, live available-player discovery, direct challenges, automatic match start, turn sound, perspective behavior, and protocol/tests.

Approach: Register a chosen name once per device, broadcast available named clients within the network group, let either player challenge another directly, begin when both seats connect, and use a short Web Audio chime only when control returns to the local player.

Risks: Simultaneous challenges must not double-seat clients, audio must wait for user interaction, names must be sanitized, and Blue/Gold board transforms must keep visuals and pointer mapping aligned.

Verification: Client smoke coverage for name persistence, challenge/start, turn alert, and both perspectives; gateway challenge/race tests; syntax/diff checks; Playwright screenshots if the host permits browser startup.

Status: Complete. Client smoke and five gateway integration tests pass; syntax/diff checks pass. Screenshot QA remains blocked by macOS denying Chromium process registration.
