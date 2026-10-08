Goal: Replace automatic nearby matchmaking with an explicit Create/Join lobby and creator-controlled start.

Scope: Nearby entry choices, game browser, two-player identity/color confirmation, creator-only Start game, and lobby-safe reconnection.

Approach: Separate connection from match start. Host and guest remain in a synchronized lobby until both are present and the Blue host explicitly starts; the first state snapshot transitions both devices into play.

Risks: Joining or reconnecting must never bypass the lobby, and only the creator may initiate the opening state.

Verification: Test Create/Join choice, hosted lobby, both identity/color rows, creator-only start, no early board transition, state synchronization, and existing reconnect/gameplay coverage.

Status: Complete. Client smoke tests verify the choice screen, two-player confirmation lobby, blocked early start, creator start, synchronization, reconnect, perspective, and gameplay. Gateway tests pass.
