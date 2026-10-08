Goal: Make core actions immediately understandable and strengthen Decadence-style button hierarchy.

Scope: Move/Wall/Card controls, card-result themes, first-time onboarding cue, and primary buttons across setup, lobby, wall confirmation, and victory.

Approach: Use action-specific color/icon treatments, a dismissible first-run “Try me” cue on Move, outcome-specific card colors, and gold/cyan primary actions while preserving the board-first layout.

Risks: Strong colors must retain contrast, selected/disabled states, touch sizing, and reduced-motion behavior without crowding mobile controls.

Verification: Extend smoke coverage for onboarding persistence and card theme classes; run interaction/gateway tests and browser screenshot workflow if available.

Status: Complete. First-run and all card themes are regression-tested; client smoke, gateway integration, syntax, and diff checks pass. Screenshot QA remains blocked by the missing Playwright Chromium executable.
