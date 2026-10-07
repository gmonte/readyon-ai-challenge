# One attendance record per worker per date, location as an attribute

The spec says attendance is tracked "per worker, per date, and per location", which reads like a three-column key, but it also states that only one attendance record and one attendance request may exist per worker per date. We key both tables on (worker, date) and store location as a plain column. This rules out a worker being PRESENT at one location and OFF at another on the same day, which the mock-ups and the request rule already imply. Reversing it later means a key change and a backfill, so it is recorded here.

**Considered**: unique on (worker, date, location). Rejected because a worker request targets one location and one date, so the merged attendance table would otherwise need per-row location disambiguation that nothing in the product needs.
