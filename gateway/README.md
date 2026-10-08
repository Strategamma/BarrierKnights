# Realm Gateway on Render

Deploy this repository with the root `render.yaml`, or create a Render Web Service with:

- Root directory: `Barrier Knights/gateway` (adjust if this folder is the repository root)
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/`

The client defaults to Render's `wss://barrier-knights-gateway.onrender.com` hostname. If Render assigns another service hostname, update the `bk-gateway` meta tag in `index.html`. A custom `gateway.decadenceinc.com` domain can be added later after its DNS and certificate are active.

The gateway groups players by Render's `X-Forwarded-For` address, lists only open halls from that network, and relays match snapshots after an explicit join. Couch Siege and Clockwork Duel never require it.

Active matches retain their latest state and private player-seat tokens in memory for 15 minutes after a disconnect. Returning PWAs automatically reclaim the same Blue/Gold seat. A Render service restart clears these temporary sessions.
