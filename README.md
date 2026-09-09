# EnterpriseIQ

Enterprise knowledge portal built with React, TypeScript, Vite and Express.

## Run locally
Install dependencies with npm install. Copy .env.example to .env.local.
Run npm run dev and open http://localhost:3000.

Seeded demo accounts:
- admin@enterpriseiq.com / admin123
- manager@enterpriseiq.com / manager123
- employee@enterpriseiq.com / employee123

Change seeded passwords before exposing the service. Demo shortcuts use the original passwords.

## Features
Password authentication, employee registration, role administration and last-administrator protection.
Permission-filtered document search, summaries, comparison and assistant queries.
Persistent bookmarks, profile preferences, password changes, conversation history and event-based analytics.
Document upload, indexing, preview, administrator deletion and reindexing.
Atomic JSON snapshots in data/enterpriseiq.json restored on restart.

Text, Markdown and CSV uploads are indexed directly. PDF/DOCX require extracted plain text
in the upload form. Native binary extraction and OCR are not implemented.
Search uses token matching, not embedding vectors. Gemini is optional; live AI behavior
requires a configured key and separate validation.

## Configuration
.env.local is loaded before .env. PORT defaults to 3000.
DATA_FILE selects the JSON store. JWT_SECRET is required in production.
Development uses an ephemeral secret, so restarting invalidates development sessions.
GEMINI_API_KEY enables the existing Gemini integration.

## Checks and deployment
Run npm run typecheck and npm run build.
Set NODE_ENV=production and JWT_SECRET before running npm start.
The Vite asset base in vite.config.ts must match your hosting path.
The JSON store supports one server process. Use a transactional database for multi-instance
deployment and back up the data directory. SSO, native PDF/OCR and production deployment
are not included in this upgrade.

Run node tests/integration.mjs after building for isolated API and persistence checks.
