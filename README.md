# SOWMETRIC
Precision in Every Seed.

Local prototype for seed calculation and simulated dispensing. Requires Node 24 (built-in SQLite). No real hardware is activated.

## Run
`npm install`
`npm run dev`
Open http://127.0.0.1:5173. For production: `npm run build` then `npm start`, open http://127.0.0.1:3001.
If npm is unavailable in this workspace environment, run `node "$env:TEMP\sowmetric-npm\package\bin\npm-cli.js" install` in PowerShell; launch the frontend with `node node_modules/vite/bin/vite.js` and backend with `node server.mjs` in separate terminals.

Admin password is generated and printed at server startup. Set ADMIN_PASSWORD in the shell for a persistent password; no default credentials are seeded. Session tokens expire after one hour and are kept in memory. Bind only to localhost. This prototype is not hardened for internet exposure.

## Interfaces
The single-page touchscreen provides home, crop selection, farm inputs/results, dispensing, planting guide, and administrator views. Admin includes overview, transactions with CSV export, read-only inventory, and machine status. API: POST /api/login, GET /api/crops, POST /api/transactions (simulation only), GET /api/admin/transactions (Bearer token required).

## Demo
Choose Try maize example, review inputs, proceed, confirm lot/container, and start. Batches are limited to 4 kg below a 5 kg nominal sensor capacity. Each subsequent batch requires explicit empty-container confirmation. Pause, resume, stop, faults and emergency stop are available. Receipts use browser printing. Demo reset starts a new workflow and preserves history. Simulations never deduct stock.

## Mathematics
Acres × 4046.8564224 or hectares × 10000 gives square meters. Whole planting holes are floored from area / (row meters × plant meters). Base seeds = holes × seeds per hole. Reserve is rounded up separately. Weight kg = total seeds × TSW grams / 1,000,000. Expected germinated planted seeds excludes reserve and does not increase allocation. All reference profiles are illustrative, not verified agronomic advice.
Run `npm test` for independent calculation and batch tests.

## Persistence
Browser localStorage retains demo history. SQLite sowmetric.sqlite stores submitted simulation records in an indexed records table, created on first startup. This is a prototype schema, not the full relational domain model requested. Failed offline submissions stay in browser history but are not automatically synchronized. Calculator and simulation need no network once loaded; installable PWA and cold-start offline caching are not implemented.

## State model
READY → TARING → DISPENSING → SETTLING → BATCH COMPLETE or COMPLETED. DISPENSING may PAUSE then RESUME; stop and errors halt the simulation. Each batch needs confirmation before taring. The animated schematic shows hopper, screen, metering wheel, gate/chute, tray and scale.

## Hardware architecture and limitations
hardware/protocol.md describes the future boundary. Real USB transport, controller firmware, watchdog, acknowledgements, validated scale feedback and physical inventory accounting are not implemented or tested. Real control is intentionally unavailable. Physical emergency stop must cut motor power independently; software stop is supplementary. Never enable motors until an authorized operator has validated interlocks, calibration and wiring.

## Remaining implementation
This is a runnable foundation, not the complete requested production platform. Outstanding: editable crops/varieties/lots and guidance, full normalized schema and migrations, staff/operator roles, calibration tools, harvest scenario configuration, robust simulator state-machine tests, durable offline queue/PWA, inventory movement ledger, authenticated physical dispatch, serial bridge/firmware, comprehensive accessibility/browser verification, sensor capacity accounting for container mass, rate-limited login and deployment hardening. Current inventory and machine values are read-only demo profiles. No physical dispensing or harvest claims are made.
## Implementation update
The server now applies `db/migrations/001_initial.sql` and seeds crops, varieties, lots and machine data. Administrative lot editing records inventory adjustments; login has a per-address attempt limit. Demo transactions use client IDs for idempotent submission and are also recorded as normalized sessions. The browser keeps a retry queue for unsent transactions and caches the crop catalog. Production builds register a service worker; installation and offline cold-start behavior still require browser verification.

`shared/device.mjs` now contains independently tested simulator and transport-based hardware adapters. These are not yet wired to the touchscreen's existing simulation, and the physical adapter needs an actual serial transport. Fifteen tests cover arithmetic, simulator transitions, interlocks, authorization and transactional inventory accounting. Hardware accounting is tested with an in-memory database only; no physical dispensing endpoint is enabled.

Seed inventory editing and server transaction loading replace the earlier read-only inventory limitation. Other limitations above remain unless explicitly superseded here.

The calculation screen now includes optional harvest scenarios with editable yield/ha, survival and bag mass. These are unvalidated demonstration assumptions. Calculator input bounds reject zero-hole fields and excessive batch allocations. The automated suite now contains 17 passing tests.

## 3D dispensing console
The machine is now constructed from CSS 3D surfaces, with a rotation slider and cabinet inspection view. The hopper, metering wheel, chute, animated seeds, tray and weighing display respond to simulation state. The redesigned console shows bulk/fine feed stages, percentage progress and settling guidance. Flow uses a bounded, mildly varying coarse rate and switches to a lower fine rate near target; the model is illustrative, not calibrated to physical equipment. Reduced-motion preferences disable continuous animation. Twenty automated tests pass, including flow switching, completion and bounded time steps. Production build verified; visual browser QA was blocked by a preview-tool timeout.
