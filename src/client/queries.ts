import { graphql } from "./gql";

export const MeDocument = graphql(`
  query Me {
    me {
      id
      name
      role
      externalId
      memberships {
        jobTitle
        location {
          id
          name
        }
      }
    }
  }
`);

// Kept separate on purpose: `personas` is public, `locations` needs a signed-in user. In one document an
// UNAUTHENTICATED error on the non-null `locations` field would null the whole response, personas included.
export const PersonasDocument = graphql(`
  query Personas {
    personas {
      id
      name
      role
    }
  }
`);

export const NavLocationsDocument = graphql(`
  query NavLocations {
    locations {
      id
      name
    }
  }
`);

export const PendingCountDocument = graphql(`
  query PendingCount($locationId: ID!) {
    pendingRequestCount(locationId: $locationId)
  }
`);

export const AttendanceEntryFragment = graphql(`
  fragment AttendanceEntryFields on AttendanceEntry {
    id
    date
    state
    source
    jobTitle
    worker {
      id
      name
      externalId
    }
    record {
      id
      checkInAt
      checkOutAt
      note
    }
    request {
      id
      status
      type
      note
      createdAt
      reviewedAt
      reviewedBy {
        id
        name
      }
    }
  }
`);

export const AttendanceFeedDocument = graphql(`
  query AttendanceFeed($locationId: ID!, $filter: AttendanceFilter) {
    attendanceFeed(locationId: $locationId, filter: $filter) {
      counts {
        all
        pending
        present
        off
      }
      entries {
        ...AttendanceEntryFields
      }
    }
  }
`);

export const LocationDocument = graphql(`
  query LocationHeader($id: ID!) {
    location(id: $id) {
      id
      name
      selfCheckInEnabled
      managerMarkingEnabled
    }
  }
`);

export const OffBalanceDocument = graphql(`
  query OffBalance($locationId: ID!) {
    offBalance(locationId: $locationId) {
      year
      allowance
      used
      remaining
    }
  }
`);

export const LocationWorkersDocument = graphql(`
  query LocationWorkers($locationId: ID!) {
    locationWorkers(locationId: $locationId) {
      jobTitle
      user {
        id
        name
        externalId
      }
    }
  }
`);

export const LocationsPageDocument = graphql(`
  query LocationsPage {
    locations {
      id
      name
      address
      selfCheckInEnabled
      managerMarkingEnabled
      offDaysPerYear
      workerCount
      managerCount
    }
  }
`);

export const ApproveDocument = graphql(`
  mutation Approve($id: ID!) {
    approveAttendanceRequest(id: $id) {
      id
      status
    }
  }
`);

export const RejectDocument = graphql(`
  mutation Reject($id: ID!) {
    rejectAttendanceRequest(id: $id) {
      id
      status
    }
  }
`);

export const CancelDocument = graphql(`
  mutation Cancel($id: ID!) {
    cancelAttendanceRequest(id: $id) {
      id
      status
    }
  }
`);

export const SubmitRequestDocument = graphql(`
  mutation SubmitRequest($input: SubmitAttendanceRequestInput!) {
    submitAttendanceRequest(input: $input) {
      id
      status
    }
  }
`);

export const MarkAttendanceDocument = graphql(`
  mutation MarkAttendance($input: MarkAttendanceInput!) {
    markAttendance(input: $input) {
      id
      state
    }
  }
`);

export const SetFlagsDocument = graphql(`
  mutation SetFlags($input: SetLocationFeatureFlagsInput!) {
    setLocationFeatureFlags(input: $input) {
      id
      selfCheckInEnabled
      managerMarkingEnabled
    }
  }
`);
