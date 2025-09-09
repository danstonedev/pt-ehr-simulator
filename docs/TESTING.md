# Testing & QA

This project favors lightweight, browser‑based tests.

## Run the app locally

- Windows PowerShell: `./start_servers_simple.ps1` from repo root (or `app/`)
- Open <http://localhost:3000>

## Browser tests

- While the server is running, open files under `app/tests/*.test.html` in your browser.
- Examples: `wiring.test.html`, `site-menu.test.html`.

## Lint & format

- `npm run lint` → ESLint over `app/js/**/*.js`
- `npm run format` → Prettier write
- `npm run check` → ESLint + Prettier check

## Debug mode

- Append `?debug=1` to the URL to enable extra console diagnostics in core modules.
