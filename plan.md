Goal: Restore reliable desktop movement and wall placement on the published GitHub Pages build.

Scope: Canvas activation input only, with regression coverage across movement, touch wall confirmation, bot play, and rotated Wi-Fi input.

Approach: Commit immediately on `pointerdown`, retain a deduplicated `click` fallback, and show feedback for invalid movement targets while retaining pointer movement for wall previews.

Risks: Touch click events must retain `pointerType` where available so the preview-and-confirm wall flow remains intact.

Verification: Repeat client smoke tests for mouse movement, touch wall preview/confirm, scaled coordinates, bot response, and rotated Wi-Fi controls; run gateway regression tests and syntax checks.

Status: Complete. The live v28 build was confirmed current; v29 commits board actions on pointer-down with a tested click fallback and explicit invalid-target feedback. Ten randomized client runs, gateway regressions, and syntax checks pass. Live screenshot automation remains blocked by the host's Chromium permission restriction.
