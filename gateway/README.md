# Realm Gateway on Render

Deploy this repository with the root `render.yaml`, or create a Render Web Service with:

- Root directory: `Barrier Knights/gateway` (adjust if this folder is the repository root)
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/`

Point `gateway.decadenceinc.com` at the Render service using Render's custom-domain setup. If a different hostname is preferred, change the `bk-gateway` meta tag in `index.html`.

The gateway groups players by Render's `X-Forwarded-For` address, lists only open halls from that network, and relays match snapshots after an explicit join. Couch Siege and Clockwork Duel never require it.
