# Workforce Management

A single company tracks daily attendance of its workers across many locations. Workers ask for attendance changes; managers decide them at the locations they manage.

## Language

### Organisation

**Company**:
The one organisation that owns every location. There is exactly one.

**Location**:
A site of the company where workers and managers operate. Every permission and every piece of ownership is scoped to a location.
_Avoid_: Site, branch, venue

**Feature flag**:
A per-location switch that changes system behaviour. The two flags are Self check-in and Manager attendance marking.

**Self check-in**:
Feature flag. When enabled, a worker's PRESENT request at that location is approved automatically. When disabled it waits for a manager.

**Manager attendance marking**:
Feature flag. When enabled, managers may mark attendance directly at that location. When disabled they can only decide requests.

### People

**User**:
A person who can act in the system. Every user has exactly one role: WORKER, MANAGER or SUPER_ADMIN. A person is never both a worker and a manager.
_Avoid_: Account, persona, employee

**Role**:
The single global capability class of a user. WORKER, MANAGER or SUPER_ADMIN.

**Worker**:
A user with the WORKER role. Belongs to one or more locations and holds one job title at each.

**External identifier**:
The unique code by which third-party systems identify a worker (for example `RO-1042`).
_Avoid_: Employee number, external ID, badge ID

**Job title**:
The position a worker holds at one location. A worker has exactly one job title per location they belong to.
_Avoid_: Position, role

**Manager**:
A user with the MANAGER role. Belongs to one or more locations and decides requests and marks attendance there.

**Super admin**:
A user with the SUPER_ADMIN role. Manages locations and feature flags across the whole company.

**Membership**:
The fact that a worker or manager belongs to a given location.
_Avoid_: Assignment

### Attendance

**Attendance record**:
The actual attendance of one worker on one date, at one location. At most one exists per worker per date.
_Avoid_: Attendance, entry, log

**Attendance state**:
The value of an attendance record: PRESENT or OFF.
_Avoid_: Status (reserved for requests)

**Source**:
How an attendance record came to exist: MANAGER marking, third-party INTEGRATION, or an approved WORKER_REQUEST.

**Check-in / Check-out**:
Optional times of arrival and departure recorded on a PRESENT request and its resulting attendance record.

**Attendance request**:
A worker's ask to have a date recorded as PRESENT or OFF at one location. A worker has at most one open request (PENDING or APPROVED) per date; rejected or cancelled requests leave room for a new one. It never changes attendance until a manager approves it, unless Self check-in auto-approves it.
_Avoid_: Request (alone), ticket, leave request

**Request type**:
What the request asks for: PRESENT or OFF.

**Request status**:
Where a request is in its lifecycle: PENDING, APPROVED, REJECTED or CANCELLED.

**Open request**:
A request whose status is PENDING or APPROVED. Only open requests count toward the one-per-date rule.

**Approval**:
A manager's decision on a PENDING request. Only managers of the request's location may approve or reject it. Approval produces or updates the attendance record for that worker and date.
_Avoid_: Review, validation

**Attendance entry**:
One row of the attendance table: a worker and a date, showing the attendance record if one exists and the latest request for that date if any. Its displayed state is the record's state, or the requested type while no record exists.
_Avoid_: Row, item, feed item

**Integration**:
A third-party system that records attendance by identifying workers through their external identifier.

### Time off

**OFF allowance**:
The number of OFF days per year a location grants its workers.
_Avoid_: Quota, PTO, leave days

**OFF balance**:
A worker's OFF allowance at a location minus the OFF days recorded for them there in the current year. Shown for information only; it does not block requests.
