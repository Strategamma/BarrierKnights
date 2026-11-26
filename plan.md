Goal: Fix same-screen player-facing controls, safe Back navigation, help visibility and action hints; introduce a matte 3D logo.
Scope: Existing static game UI and branding only; preserve game rules and online protocol.
Approach: Place touch decisions inside the active player's seat; retain the drawing player's card orientation after turns change; share Back confirmation; expose the existing guide from gameplay; contain the hint within buttons; integrate a transparent generated logo.
Risks: Short portrait/landscape screens, bot/online orientation, immediate card turn changes, cached PWA assets.
Verification: Client smoke suite, browser interactions and responsive screenshots, JavaScript syntax, asset/cache checks.

Status: Implemented. Client smoke and five responsive browser sizes pass; screenshots reviewed. Local preview only; no deployment.
