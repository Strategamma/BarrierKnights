Goal: Make the mode picker and nested popups return safely to the exact UI state that opened them.

Scope: Modes opened from gameplay or victory, active Wi-Fi/session preservation, bot scheduling, contextual return labels, and regression tests.

Approach: Treat mode selection as a reversible overlay, defer session teardown until a replacement mode is chosen, remember the caller, and restore gameplay or victory with a contextual return control.

Risks: Returning must not clear state, disconnect Wi-Fi, lose a bot turn, dismiss victory permanently, or expose a meaningless back action on initial launch.

Verification: Client smoke coverage for gameplay and victory callers, state preservation, initial-launch behavior, Wi-Fi/bot regressions, gateway tests, syntax/diff checks, and browser review when available.

Status: Complete. Client smoke verifies caller labels, local state preservation, victory restoration, and Wi-Fi socket survival; five gateway tests and syntax/diff checks pass.
