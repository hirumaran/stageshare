# Calliope / Clio — Messaging Correctness, Backend Follow-Through & Trust-and-Safety: Debrief

Scope: Workstreams A (chat reliability), B (backend follow-through), C (trust & safety / the minor
question), D (config hygiene). Every item below was verified against the actual code before any change.

## Gating decisions (made with the product owner)

| Decision | Choice | Consequence |
|---|---|---|
| **C1 actor model** | **Students (minors) are in scope** | C3 (age gating) + C4 (moderation/redaction) are **launch gates**. |
| **A4 E2EE posture** | **Drop E2EE on DMs** | Single-tenant, non-federated island; unlocks a server-side Matrix actor (A1) and server-side redaction/takedown (C4). |
| **A3 thread model** | **Room per borrow** | Fresh, per-request room with system-side creation; per-loan context, per-loan redaction. |

---

## Per-issue results

### Workstream A — chat reliability

- **A1 — no server-side room creation (CONFIRMED → FIXED).**
  Was: room minted in the *owner's browser*; on token/staleness failure the approved request was left with
  `matrix_room_id = NULL`, recoverable only by the owner manually retrying.
  Fix: room creation moved **server-side**. Approve now enqueues a deduped BullMQ `create-borrow-room` job
  (`roomQueue`, jobId `room-<id>`); a new `room.worker.js` mints the owner's token via the existing admin-login
  primitive (`adminLoginAsUser`), creates the room, invites the borrower, and persists `matrix_room_id`
  idempotently (`WHERE matrix_room_id IS NULL`). BullMQ retries (5×, exp backoff) make the failure path
  system-recoverable, not human-only.
  Files: `utils/matrix.js`, `queues/index.js`, `workers/room.worker.js`, `server.js`, `request.controller.js` (approve enqueue).

- **A2 — borrower dead-ended on retry (CONFIRMED → FIXED).**
  Was: UI exposed "Retry setup" to the borrower, but backend `setRequestRoom` is owner-only → guaranteed 403
  (plus a secondary bug: the borrower's retry invited *itself*).
  Fix: new `POST /requests/:id/room/retry` open to **either party**, which re-enqueues the (deduped) server job;
  the owner-only `approve`/`setRequestRoom` authorization is unchanged. Frontend retry now calls this endpoint;
  the self-invite path is gone (client no longer creates rooms).
  Files: `request.controller.js` (`retryRoomSetup`), `request.routes.js`, `use-conversations.ts`, `conversation-list-pane.tsx`.

- **A3 — one-DM-per-pair collapse (CONFIRMED → FIXED).**
  Was: `createOrGetDMRoom` reused any 2-member room → repeat borrows shared one thread; `matrix_room_id` had no
  per-request meaning.
  Fix: server creates a **fresh room per request** (named `Borrow: <item>`, topic referencing request id); the
  pair-reuse client function was removed. No UNIQUE constraint was added (it would wrongly reject; the relationship
  is now enforced by the server worker writing exactly one room per request).
  Files: `room.worker.js`, `matrix-store.ts` (removed `createOrGetDMRoom`), `borrowing.tsx`.

- **A4 — E2EE vs moderation contradiction (PARTIALLY CONFIRMED → RESOLVED per decision).**
  Was: DMs were E2EE (megolm) with zero moderation capability; landing copy ("Clio tracks the whole conversation")
  oversold server visibility.
  Fix (decision = drop E2EE): server-created rooms are **unencrypted** (no `m.room.encryption` initial_state); the
  client E2EE room-creation path was removed. Marketing copy softened to "keep the whole conversation tied to the
  loan" (honest; no implied surveillance). Client crypto init left intact (harmless; decrypts any legacy rooms).
  Files: `matrix-store.ts`, `utils/matrix.js` (`createBorrowRoom` is explicitly unencrypted), `landing-showcase.tsx`.

- **A5 — mobile messaging (INTENTIONAL STUB → DEFERRED).** No Matrix SDK/crypto in `mobile/`; `bootMatrix` is a
  documented no-op. Web-only today. Not a defect — see "Deferred."

- **A6 — pre-approval Q&A (PARTIALLY CONFIRMED → RECOMMEND).** Ticket's claim "no note field" is **wrong**:
  `requester_note` exists end-to-end. The real gap (one-way only; no owner reply pre-approval) is recommended, not
  built. **Separately flagged:** `frontend/src/pages/cart.tsx` `handleSubmitRequests` is a stub that never calls
  `createBorrowRequest` (borrow requests can't be created from the cart today). Out of this ticket's scope — reported, not fixed.

### Workstream B — backend follow-through

- **B1 — overlap exclusion + derived overdue (INTENTIONAL → NO-ACTION, re-verified).** Constraint is correctly
  partial `WHERE status IN ('approved','active')`; overdue is derived, never persisted; no overdue-writing cron.
  Empirically confirmed by invariant tests T1/T2/T3 (double-booking blocked, returned re-borrowable, overdue-active still blocks).

- **B2 — idempotency (PARTIALLY CONFIRMED → FIXED).** State machine + wiring were sound; the ticket's "4xx cached as
  success" worry was **refuted**. The two real defects fixed: (1) **no client sent the header** → middleware was a
  no-op; web clients now send deterministic `Idempotency-Key`s on create/transition. (2) **FAILED / crash-orphaned
  STARTED keys wedged forever**; the middleware now reclaims a FAILED key or a STARTED key older than 60s and
  re-executes, while a recent in-flight key still 409s. Confirmed by invariant test T7.
  Files: `middleware/idempotency.js`, `ui-store.ts`.

- **B3 — migration deploy safety (CONFIRMED → RUNBOOK, with a correction).** See runbook. Correction to the original
  hypothesis: migration **021 is idempotent** (guarded by `IF NOT EXISTS` + a `pg_constraint` DO-block — not a bare
  `ADD CONSTRAINT`), verified by a two-pass apply. The **real** deploy hazard is `schema.sql` — it `DROP TABLE IF
  EXISTS … CASCADE`s every core table on each run, so `npm run db:migrate` wipes the DB.

- **B4 — config templates (NOT CONFIRMED).** YAML + nginx parse cleanly (re-verified structure). `nginx -t` and a live
  Synapse config-load could **not** be run here (nginx not installed). The real issue was D1 (below). Runbook lists
  the validations to run at deploy.

- **B5 — global admin cross-tenant (INTENTIONAL → NO-ACTION + hardening).** A school user **cannot** become `admin`
  through any application path (schema default `'user'`; `register` never accepts `role`; no role-mutation endpoint).
  Cross-tenant admin is district-staff-only by design. Added defense-in-depth: a `users_role_check` CHECK constraint
  (migration 024) so a stray role can never be written (invariant test T6).

- **B6 — email case-sensitivity (CONFIRMED → DEFER with plan).** Worse than described: registration stores email
  verbatim while forgot-password lowercases its lookup → uppercase-registered accounts can't reset (anti-enumeration
  hides it); login is fully case-sensitive. Needs a data migration; see "Deferred."

- **B7 — `last_login` in peer roster (CONFIRMED → FIXED).** Removed `u.last_login` from the peer-facing
  `getUsersBySchool` SELECT (no frontend/mobile consumer). Admin endpoint unchanged. File: `school.controller.js`.

### Workstream C — trust, safety & the minor question

- **C1 — user model (CONFIRMED).** Age-blind, role-flat (`{user, admin}`); minors can register & DM; no age signal.
  Decision: students in scope → C3/C4 are launch gates.

- **C2 — reporting + blocking (BUILT).** New `user_blocks` + `reports` tables (migration 023); new
  `moderation.controller.js` + `/moderation` routes: self-service block/unblock/list; report a user/message/room into
  a reviewable queue (with reporter-submitted `evidence_text`); admin-only queue listing + actioning. Blocks are
  enforced bidirectionally in `createRequest` (a block prevents a new borrow pairing → and therefore chat). Invariant test T4.

- **C3 — age model + adult↔minor gating (BUILT, data-gated).** Added `user_type ('staff'|'student'|'unknown')` age
  signal (migration 024). Because Clio has **no cold-contact DMs** (chat exists only after an approved borrow), gating
  the *pairing* gates the channel: `createRequest` now blocks a staff↔student borrow pairing by default
  (`ALLOW_ADULT_MINOR_BORROW` opt-in for mediated programs). Invariant test T5. **The gate is only meaningful once
  roster data populates `user_type`** — see "Deferred / launch gate."

- **C4 — redaction/takedown under (now-dropped) E2EE (BUILT).** `utils/matrix.js` gained `redactRoomEvent` (per-message
  redaction as a room member via admin-minted token) and `shutdownRoom` (Synapse admin room delete/purge). The admin
  `PATCH /moderation/reports/:id` action wires reports to real enforcement (`dismiss` / `redact_message` /
  `shutdown_room`). Reports now lead to an action staff can actually take.

### Workstream D — config hygiene

- **D1 — skene vs calliope (CONFIRMED real → FIXED locally).** `homeserver.yaml` references `matrix.calliope.*`
  signing-key + log-config paths, but only `matrix.skene.*` files existed on disk → Synapse couldn't load them.
  Renamed the two on-disk files to the `calliope` names (preserves the existing signing key / identity continuity).
  `server_name` and nginx already agreed on `calliope`. Note: `synapse/data/` is gitignored local deploy state, so
  this is an environment fix (also captured in the runbook); the tracked templates were already consistent.

---

## Documented / deferred (reported, not fixed)

- **A5 (mobile messaging):** intentionally stubbed; web-only. To build later: Matrix Rust-crypto WASM has no RN
  runtime; SDK crypto/sync store assumes IndexedDB (needs an AsyncStorage/SQLite shim); `react-native-get-random-values`
  polyfill required. The drop-E2EE decision removes the hardest blocker (crypto) if/when mobile chat is built.
- **A6 (pre-approval Q&A):** `requester_note` already exists (one-way). Recommend a structured two-way option later;
  do NOT add open pre-approval DMs (keeps the safe no-cold-contact posture). Also: **cart submit is a non-functional
  stub** (`cart.tsx`) — flag for the frontend owner.
- **B6 (email case-sensitivity):** fix needs to ship as one unit — normalize on write (register/login/forgot) + a data
  migration: (1) detect collisions `SELECT lower(email), count(*) … HAVING count(*)>1` and resolve manually;
  (2) `UPDATE users SET email = lower(email)`; (3) enforce with `CREATE UNIQUE INDEX ON users (lower(email))` (preferred
  over `citext`). A human must run the collision audit first.
- **C5 (data minimization / retention):** B7 done (the cheap win). Recommend: collect only what borrowing needs, no
  precise minor geolocation, honor the 365d retention, define an account-deletion/purge path. **If under-13s are ever
  in scope, COPPA's school-consent pathway + written infosec-program expectation apply — flag for counsel (not legal advice).**
- **B5 hardening beyond the CHECK:** document the out-of-band `admin` provisioning procedure; if a school-scoped
  administrator is ever introduced, make it a distinct `school_admin` role (don't reuse global `admin`).

---

## Deploy runbook

1. **`npm run db:migrate` is DESTRUCTIVE (highest-priority warning).** `schema.sql` begins with
   `DROP TABLE IF EXISTS … CASCADE` for every core table, so the migrate script **wipes and recreates the DB on every
   run**. It is a dev-bootstrap tool, *not* a production migration runner. For a populated production DB, apply
   migrations `023`/`024` (and any future ones) **individually**, never via this script. Recommend introducing a
   tracked, non-destructive migration runner before any prod data exists.

2. **Migrations 023 & 024 are safe and idempotent** (verified: two-pass apply on Postgres 16). `024` adds the
   `users_role_check` CHECK, which **validates existing rows** — audit first: `SELECT DISTINCT role FROM users;`
   must be a subset of `('user','admin')` or the constraint add fails.

3. **Migration 021 (pre-existing concern, still applies if applied to a populated table):** requires
   `CREATE EXTENSION btree_gist` (trusted on PG13+ → `CREATE` on DB suffices; superuser on PG12). It is idempotent.
   If ever added to a table that already has data (i.e., outside the schema-reset flow), pre-flight for overlaps:
   ```sql
   SELECT a.id, b.id, a.item_id FROM borrow_requests a JOIN borrow_requests b
     ON a.item_id=b.item_id AND a.id<b.id
    AND a.status IN ('approved','active') AND b.status IN ('approved','active')
    AND daterange(a.requested_date,a.return_date,'[]') && daterange(b.requested_date,b.return_date,'[]');
   -- also flag NULL-date approved/active rows (unbounded ranges can also collide):
   SELECT id,item_id,status FROM borrow_requests
    WHERE status IN ('approved','active') AND (requested_date IS NULL OR return_date IS NULL);
   ```

4. **Idempotency requires the client header (now wired).** Web clients send `Idempotency-Key` on create/transition.
   The mobile app does not mutate `/requests` yet; when it does, it must send the header or the protection is a no-op.

5. **Server-side Matrix actor (A1/C4) needs config + LIVE verification — NOT runnable in this environment.**
   Requires `MATRIX_ADMIN_TOKEN`, `MATRIX_HOMESERVER_URL`, `MATRIX_DOMAIN`. The new flows
   (`createBorrowRoom`, `redactRoomEvent`, `shutdownRoom`, the `room.worker`) were `node --check`'d and reasoned
   through but **must be verified against a live Synapse** before launch: approve → room appears with both members,
   unencrypted; retry by borrower works; admin `redact_message` and `shutdown_room` succeed. The admin token must
   never reach the client.

6. **Synapse / nginx config validation (run at deploy — could not run here; nginx not installed):**
   `nginx -t -c synapse/nginx-matrix.conf` and a Synapse config-check (container start / `--generate-config` dry run).
   YAML + nginx structure were validated statically (no parse errors found).

7. **D1 deploy note:** `synapse/data/` is gitignored generated state; the stale `matrix.skene.*` files were renamed to
   `matrix.calliope.*` to match `homeserver.yaml`. A fresh deploy that regenerates config via `generate-config.sh`
   (already `calliope`) is also consistent. Separately: the signing key + secrets currently live in that dir — keep
   them out of any image/VCS (secret-hygiene, not addressed here).

8. **C3 launch gate:** the adult↔minor gate is inert while `user_type='unknown'` (no roster age data). **Until a school
   roster populates `user_type`, restrict launch to staff-only / staff-mediated borrowing.** Do not onboard students
   before roster-based age assurance exists and C4 enforcement is verified live (per item 5).

---

## Verification performed

- **Static:** `node --check` on all changed/new backend JS (clean); frontend `tsc -b --noEmit` (exit 0).
- **Migrations:** full chain `schema.sql + 010..024` applied on a throwaway Postgres 16 cluster; **two-pass re-run**
  confirmed idempotency (and surfaced the destructive-`schema.sql` fact).
- **Invariants (real Postgres, `backend/src/db/tests/invariants.sql`, 8/8 PASS):** double-booking blocked; re-borrow
  after return; overdue-active still blocks; bidirectional block enforcement; adult↔minor signal; role CHECK rejects
  unknown role; idempotency FAILED-reclaim + recent-STARTED-hold.
- **Could NOT verify here (flagged above):** live Synapse room creation / redaction / shutdown; `nginx -t`; live
  Synapse config load; end-to-end app run (needs Redis + env + Synapse).
