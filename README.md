# Barrier Knights

A browser strategy game for two players on one device, nearby devices over Wi-Fi, or a single player against the computer.

## Run locally

Serve this folder with any static web server and open `index.html` through the server URL. Nearby Wi-Fi play also requires the gateway in `gateway/`.

## Deploy

- Publish the static files to the website host.
- Deploy `render.yaml` on Render for nearby-game discovery and synchronization.
- Confirm the deployed Render hostname returns the gateway health JSON, then set that `wss://` hostname in the `bk-gateway` meta tag in `index.html`.
- Confirm the website custom domain has a valid HTTPS certificate before announcing the release; PWA installation and service workers require a secure origin.

Gateway-specific setup is documented in `gateway/README.md`.
