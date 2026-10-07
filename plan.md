Goal: Make game setup language immediately understandable and stabilize card popups.

Scope: Mode names, helper copy, nearby-game actions/status, difficulty labels, and card reveal positioning.

Approach: Use literal labels with one-line explanations, retain generated identities only where useful, and keep the card popup's centering transform throughout its animation.

Risks: Animation keyframes can override the popup's base transform and cause visible jumping.

Verification: Run gameplay and gateway suites, assert the card animation ends with its centering transform, and retain Realm Link synchronization coverage.

Status: Complete. Gameplay, Realm Link, gateway, and card-centering assertions pass. Live visual inspection was unavailable because the ambient file tab was not exposed to browser automation.
