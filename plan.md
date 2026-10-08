Goal: Restore reliable desktop movement and wall placement on the published GitHub Pages build.

Scope: Canvas activation input only, with regression coverage across movement, touch wall confirmation, bot play, and rotated Wi-Fi input.

Approach: Replace fragile raw `pointerup` activation with standard `click` activation while retaining pointer movement for desktop wall previews.

Risks: Touch click events must retain `pointerType` where available so the preview-and-confirm wall flow remains intact.

Verification: Repeat client smoke tests for mouse movement, touch wall preview/confirm, scaled coordinates, bot response, and rotated Wi-Fi controls; run gateway regression tests and syntax checks.

Status: Complete. Published and local files were confirmed identical; standard click activation replaces raw pointer-up, cache is v28, and repeated client plus gateway regressions pass. Live screenshot automation remains blocked by the host's Chromium permission restriction.
