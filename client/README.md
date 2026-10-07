# NexaOps Client

The NexaOps frontend is a static HTML/CSS/JavaScript dashboard. It calls the NexaOps REST API and uses Socket.IO for live project activity and notifications.

## Features and files

- `index.html`, `login.html`, `register.html`, and `notifications.html`
- `js/app.js`: application startup, Socket.IO connection, live updates
- `js/workspace.js`: project/task workspace interactions
- `js/common.js`: shared API and browser state helpers
- `css/`: main and responsive styles

## Run locally

1. Start the backend as described in [`../server/README.md`](../server/README.md).
2. The current API URL and Socket.IO host are `https://nexaops-server.vercel.app`. Change the `API` constant in `js/common.js` to `http://localhost:5000/api` and the `window.io(...)` server URL in `js/app.js` to `http://localhost:5000`.
3. Serve this directory, for example with `python -m http.server 5500`, and open `http://localhost:5500`. Register/sign in before accessing protected views.

## Configuration

The browser's REST API base URL is the `API` constant in `js/common.js`; the Socket.IO origin is specified in `js/app.js`. When developing locally, update both so HTTP and realtime traffic use the same backend. The client loads the Socket.IO browser library from the Socket.IO CDN.

## Links

- **Live client:** No client deployment URL is configured in the repository.
- **Live API and Socket.IO:** [https://nexaops-server.vercel.app](https://nexaops-server.vercel.app)
- **GitHub:** [sumonkaysar/CodeAlpha_NexaOps](https://github.com/sumonkaysar/CodeAlpha_NexaOps)

## Backend integration

The REST API and Socket.IO event contracts—including request bodies, response payloads, access rules, and event directions—are documented in [`../server/README.md`](../server/README.md). Sign in before using protected views; both API calls and the socket handshake use the same JWT.

## Local development tips

- Serve this folder using a static HTTP server, not the `file:` protocol.
- Keep the client origin in the server's `CLIENT_ORIGIN` environment variable aligned with the origin used by the static server.
- Register/sign in, create or join a project, then open the workspace in multiple browser sessions to exercise live updates.

## Troubleshooting

- If sign-in works but live updates do not, verify the Socket.IO origin in `js/app.js` and browser console connection errors.
- If the API returns CORS errors, check `CLIENT_ORIGIN` in `server/.env` against the exact scheme, host, and port of the client.
- Reauthenticate if a socket connection is rejected because its JWT is missing or expired.

## Browser support

Use a modern browser with JavaScript, Fetch, and Socket.IO support. External CDN resources and Google Fonts require network connectivity.
