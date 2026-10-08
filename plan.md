Goal: Make every major navigation state clearer and modernize Nearby Wi-Fi discovery and lobby.

Scope: Mode picker, rules/help, Wi-Fi discovery, waiting lobby, card feedback, victory navigation, Decadence Inc links, and gateway presence metadata.

Approach: Keep the existing single-page architecture; add clear back/next actions and helper text, a privacy-honest network status card, live Barrier Knights player presence, and lightweight reduced-motion-safe lobby animations.

Risks: Browsers cannot expose the Wi-Fi SSID or enumerate router devices. Show “Current network” and only players connected to the Barrier Knights gateway; keep network identity private and scoped by the gateway’s existing network key.

Verification: Run client smoke tests, gateway integration tests, syntax checks, and the web-game browser test path where the host permits it. Check narrow-screen and reduced-motion styles statically if browser launch remains blocked.

Status: Complete. Client smoke tests, gateway integration tests, syntax checks, and diff checks pass. Browser screenshot QA is unavailable because this host has no Playwright Chromium executable.
