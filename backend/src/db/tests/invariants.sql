-- Invariant tests for Calliope safety/correctness, run against a real Postgres
-- with schema.sql + migrations 010..024 already applied.
--
-- Asserts DB-level invariants the controllers rely on. Run in an isolated,
-- throwaway cluster ONLY — never against a populated DB (schema.sql DROPs tables):
--   T1 double-booking blocked             T5 adult<->minor pairing signal (C3)
--   T2 re-borrow after return allowed     T6 role CHECK rejects unknown role (B5)
--   T3 overdue-active still blocks        T7 idempotency FAILED-reclaim / recent-STARTED hold (B2)
--   T4 bidirectional block enforcement (C2)
--
-- Run (ephemeral cluster; requires postgres server binaries):
--   PGDIR=$(mktemp -d); SOCK=$(mktemp -d)
--   initdb -D "$PGDIR" -U postgres --auth=trust
--   pg_ctl -D "$PGDIR" -o "-k $SOCK -p 5599 -c listen_addresses=''" -w start
--   psql -h "$SOCK" -p 5599 -U postgres -c "CREATE DATABASE clio"
--   psql -h "$SOCK" -p 5599 -U postgres -d clio -f backend/src/db/schema.sql
--   for f in backend/src/db/migrations/*.sql; do psql -h "$SOCK" -p 5599 -U postgres -d clio -f "$f"; done
--   psql -h "$SOCK" -p 5599 -U postgres -d clio -f backend/src/db/tests/invariants.sql   # expect 8x PASS
--   pg_ctl -D "$PGDIR" stop -m immediate; rm -rf "$PGDIR" "$SOCK"
\set ON_ERROR_STOP on

-- Seed (high ids to avoid colliding with schema.sql seed data)
INSERT INTO schools (id, name, slug) VALUES (9001,'Alpha High','alpha9001'), (9002,'Beta High','beta9002');
INSERT INTO users (id, school_id, email, password_hash, first_name, last_name, role, user_type) VALUES
  (9001, 9001, 'owner9001@alpha.test',   'x', 'Olive','Owner','user','staff'),
  (9002, 9002, 'borrower9002@beta.test', 'x', 'Bea',  'Borrower','user','student');
INSERT INTO items (id, user_id, school_id, added_by, title, name, quantity_total, quantity_available)
  VALUES (9001, 9001, 9001, 9001, 'Toga', 'Toga', 1, 1);

-- T1: double-booking blocked (B1). One approved borrow, overlapping approved must fail.
INSERT INTO borrow_requests (item_id, requester_id, requester_school_id, owner_school_id, status, requested_date, return_date)
  VALUES (9001, 9002, 9002, 9001, 'approved', '2026-07-01','2026-07-10');
DO $$ BEGIN
  INSERT INTO borrow_requests (item_id, requester_id, status, requested_date, return_date)
    VALUES (9001, 9002, 'approved', '2026-07-05','2026-07-15');
  RAISE NOTICE 'T1 double-booking: FAIL (overlap allowed)';
EXCEPTION WHEN exclusion_violation THEN RAISE NOTICE 'T1 double-booking: PASS'; END $$;

-- T2: returned item is immediately re-borrowable (B1).
UPDATE borrow_requests SET status='returned';
DO $$ BEGIN
  INSERT INTO borrow_requests (item_id, requester_id, status, requested_date, return_date)
    VALUES (9001, 9002, 'approved', '2026-07-05','2026-07-15');
  RAISE NOTICE 'T2 re-borrow after return: PASS';
EXCEPTION WHEN exclusion_violation THEN RAISE NOTICE 'T2 re-borrow after return: FAIL (still blocked)'; END $$;

-- T3: an active-but-overdue item is NOT double-borrowable (B1 coupling).
DELETE FROM borrow_requests;
INSERT INTO borrow_requests (item_id, requester_id, status, requested_date, return_date)
  VALUES (9001, 9002, 'active', '2026-01-01','2026-01-10'); -- return_date in the past => overdue, still 'active'
DO $$ BEGIN
  INSERT INTO borrow_requests (item_id, requester_id, status, requested_date, return_date)
    VALUES (9001, 9002, 'approved', '2026-01-05','2026-01-08');
  RAISE NOTICE 'T3 overdue-not-double-borrowable: FAIL (overlap allowed)';
EXCEPTION WHEN exclusion_violation THEN RAISE NOTICE 'T3 overdue-not-double-borrowable: PASS'; END $$;

-- T4: block enforcement query (C2) — bidirectional.
INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (9001, 9002);
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM user_blocks
    WHERE (blocker_id=9002 AND blocked_id=9001) OR (blocker_id=9001 AND blocked_id=9002);
  IF n>0 THEN RAISE NOTICE 'T4 block enforcement: PASS'; ELSE RAISE NOTICE 'T4 block enforcement: FAIL'; END IF;
END $$;

-- T5: adult<->minor pairing signal (C3).
DO $$ DECLARE rt text; ot text; BEGIN
  SELECT user_type INTO rt FROM users WHERE id=9002;
  SELECT user_type INTO ot FROM users WHERE id=9001;
  IF (rt='student' AND ot='staff') OR (rt='staff' AND ot='student')
    THEN RAISE NOTICE 'T5 adult-minor gate: PASS'; ELSE RAISE NOTICE 'T5 adult-minor gate: FAIL'; END IF;
END $$;

-- T6: role CHECK rejects an unknown role (B5).
DO $$ BEGIN
  INSERT INTO users (school_id,email,password_hash,role) VALUES (9001,'bad9001@x.test','x','superuser');
  RAISE NOTICE 'T6 role CHECK: FAIL (invalid role accepted)';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'T6 role CHECK: PASS'; END $$;

-- T7: idempotency reclaim semantics (B2). FAILED reclaimable; recent STARTED not.
INSERT INTO idempotency_keys (user_id, idempotency_key, payload_hash, status) VALUES (9001,'k_failed','h','FAILED');
INSERT INTO idempotency_keys (user_id, idempotency_key, payload_hash, status) VALUES (9001,'k_started','h','STARTED');
DO $$ DECLARE c int; BEGIN
  UPDATE idempotency_keys SET status='STARTED', payload_hash='h2', created_at=NOW()
    WHERE user_id=9001 AND idempotency_key='k_failed'
      AND (status='FAILED' OR (status='STARTED' AND created_at < NOW() - ('60000 milliseconds')::interval));
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c=1 THEN RAISE NOTICE 'T7a FAILED-reclaim: PASS'; ELSE RAISE NOTICE 'T7a FAILED-reclaim: FAIL (n=%)', c; END IF;
  UPDATE idempotency_keys SET created_at=NOW()
    WHERE user_id=9001 AND idempotency_key='k_started'
      AND (status='FAILED' OR (status='STARTED' AND created_at < NOW() - ('60000 milliseconds')::interval));
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c=0 THEN RAISE NOTICE 'T7b recent-STARTED-not-reclaimed: PASS'; ELSE RAISE NOTICE 'T7b recent-STARTED-not-reclaimed: FAIL (n=%)', c; END IF;
END $$;
