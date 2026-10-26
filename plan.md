Goal: Reliable multiplayer presence after disconnect and mobile resume.
Scope: Always apply valid discovery snapshots, refresh on resume, distinguish connection/server errors from an empty hall.
Approach: Remove stale snapshot deduplication; refresh identity/availability without interrupting live matches; validate discovery response shape.
Risks: Keep occupied players unavailable and preserve seat recovery.
Verification: Reproduce identical snapshot after disconnect; test legacy server response, resume events, refresh and game recovery; probe live gateway.

Status: Fixed and verified in preview and connected BarrierKnights checkouts. Client regression covers identical reconnect snapshots, offline/legacy-server feedback, resumed discovery, and active-match availability. Eight gateway tests pass, including cross-address discovery. Live probe still returns the older presence-only protocol; published gateway source groups clients by forwarded IP. Frontend and gateway publication are pending.
