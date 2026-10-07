/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query Me {\n    me {\n      id\n      name\n      role\n      externalId\n      memberships {\n        jobTitle\n        location {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.MeDocument,
    "\n  query Personas {\n    personas {\n      id\n      name\n      role\n    }\n  }\n": typeof types.PersonasDocument,
    "\n  query NavLocations {\n    locations {\n      id\n      name\n    }\n  }\n": typeof types.NavLocationsDocument,
    "\n  query PendingCount($locationId: ID!) {\n    pendingRequestCount(locationId: $locationId)\n  }\n": typeof types.PendingCountDocument,
    "\n  fragment AttendanceEntryFields on AttendanceEntry {\n    id\n    date\n    state\n    source\n    jobTitle\n    worker {\n      id\n      name\n      externalId\n    }\n    record {\n      id\n      checkInAt\n      checkOutAt\n      note\n    }\n    request {\n      id\n      status\n      type\n      note\n      createdAt\n      reviewedAt\n      reviewedBy {\n        id\n        name\n      }\n    }\n  }\n": typeof types.AttendanceEntryFieldsFragmentDoc,
    "\n  query AttendanceFeed($locationId: ID!, $filter: AttendanceFilter) {\n    attendanceFeed(locationId: $locationId, filter: $filter) {\n      counts {\n        all\n        pending\n        present\n        off\n      }\n      entries {\n        ...AttendanceEntryFields\n      }\n    }\n  }\n": typeof types.AttendanceFeedDocument,
    "\n  query LocationHeader($id: ID!) {\n    location(id: $id) {\n      id\n      name\n      selfCheckInEnabled\n      managerMarkingEnabled\n    }\n  }\n": typeof types.LocationHeaderDocument,
    "\n  query OffBalance($locationId: ID!) {\n    offBalance(locationId: $locationId) {\n      year\n      allowance\n      used\n      remaining\n    }\n  }\n": typeof types.OffBalanceDocument,
    "\n  query LocationWorkers($locationId: ID!) {\n    locationWorkers(locationId: $locationId) {\n      jobTitle\n      user {\n        id\n        name\n        externalId\n      }\n    }\n  }\n": typeof types.LocationWorkersDocument,
    "\n  query LocationsPage {\n    locations {\n      id\n      name\n      address\n      selfCheckInEnabled\n      managerMarkingEnabled\n      offDaysPerYear\n      workerCount\n      managerCount\n    }\n  }\n": typeof types.LocationsPageDocument,
    "\n  mutation Approve($id: ID!) {\n    approveAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n": typeof types.ApproveDocument,
    "\n  mutation Reject($id: ID!) {\n    rejectAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n": typeof types.RejectDocument,
    "\n  mutation Cancel($id: ID!) {\n    cancelAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n": typeof types.CancelDocument,
    "\n  mutation SubmitRequest($input: SubmitAttendanceRequestInput!) {\n    submitAttendanceRequest(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.SubmitRequestDocument,
    "\n  mutation MarkAttendance($input: MarkAttendanceInput!) {\n    markAttendance(input: $input) {\n      id\n      state\n    }\n  }\n": typeof types.MarkAttendanceDocument,
    "\n  mutation SetFlags($input: SetLocationFeatureFlagsInput!) {\n    setLocationFeatureFlags(input: $input) {\n      id\n      selfCheckInEnabled\n      managerMarkingEnabled\n    }\n  }\n": typeof types.SetFlagsDocument,
};
const documents: Documents = {
    "\n  query Me {\n    me {\n      id\n      name\n      role\n      externalId\n      memberships {\n        jobTitle\n        location {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.MeDocument,
    "\n  query Personas {\n    personas {\n      id\n      name\n      role\n    }\n  }\n": types.PersonasDocument,
    "\n  query NavLocations {\n    locations {\n      id\n      name\n    }\n  }\n": types.NavLocationsDocument,
    "\n  query PendingCount($locationId: ID!) {\n    pendingRequestCount(locationId: $locationId)\n  }\n": types.PendingCountDocument,
    "\n  fragment AttendanceEntryFields on AttendanceEntry {\n    id\n    date\n    state\n    source\n    jobTitle\n    worker {\n      id\n      name\n      externalId\n    }\n    record {\n      id\n      checkInAt\n      checkOutAt\n      note\n    }\n    request {\n      id\n      status\n      type\n      note\n      createdAt\n      reviewedAt\n      reviewedBy {\n        id\n        name\n      }\n    }\n  }\n": types.AttendanceEntryFieldsFragmentDoc,
    "\n  query AttendanceFeed($locationId: ID!, $filter: AttendanceFilter) {\n    attendanceFeed(locationId: $locationId, filter: $filter) {\n      counts {\n        all\n        pending\n        present\n        off\n      }\n      entries {\n        ...AttendanceEntryFields\n      }\n    }\n  }\n": types.AttendanceFeedDocument,
    "\n  query LocationHeader($id: ID!) {\n    location(id: $id) {\n      id\n      name\n      selfCheckInEnabled\n      managerMarkingEnabled\n    }\n  }\n": types.LocationHeaderDocument,
    "\n  query OffBalance($locationId: ID!) {\n    offBalance(locationId: $locationId) {\n      year\n      allowance\n      used\n      remaining\n    }\n  }\n": types.OffBalanceDocument,
    "\n  query LocationWorkers($locationId: ID!) {\n    locationWorkers(locationId: $locationId) {\n      jobTitle\n      user {\n        id\n        name\n        externalId\n      }\n    }\n  }\n": types.LocationWorkersDocument,
    "\n  query LocationsPage {\n    locations {\n      id\n      name\n      address\n      selfCheckInEnabled\n      managerMarkingEnabled\n      offDaysPerYear\n      workerCount\n      managerCount\n    }\n  }\n": types.LocationsPageDocument,
    "\n  mutation Approve($id: ID!) {\n    approveAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n": types.ApproveDocument,
    "\n  mutation Reject($id: ID!) {\n    rejectAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n": types.RejectDocument,
    "\n  mutation Cancel($id: ID!) {\n    cancelAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n": types.CancelDocument,
    "\n  mutation SubmitRequest($input: SubmitAttendanceRequestInput!) {\n    submitAttendanceRequest(input: $input) {\n      id\n      status\n    }\n  }\n": types.SubmitRequestDocument,
    "\n  mutation MarkAttendance($input: MarkAttendanceInput!) {\n    markAttendance(input: $input) {\n      id\n      state\n    }\n  }\n": types.MarkAttendanceDocument,
    "\n  mutation SetFlags($input: SetLocationFeatureFlagsInput!) {\n    setLocationFeatureFlags(input: $input) {\n      id\n      selfCheckInEnabled\n      managerMarkingEnabled\n    }\n  }\n": types.SetFlagsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      name\n      role\n      externalId\n      memberships {\n        jobTitle\n        location {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      name\n      role\n      externalId\n      memberships {\n        jobTitle\n        location {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Personas {\n    personas {\n      id\n      name\n      role\n    }\n  }\n"): (typeof documents)["\n  query Personas {\n    personas {\n      id\n      name\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NavLocations {\n    locations {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query NavLocations {\n    locations {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PendingCount($locationId: ID!) {\n    pendingRequestCount(locationId: $locationId)\n  }\n"): (typeof documents)["\n  query PendingCount($locationId: ID!) {\n    pendingRequestCount(locationId: $locationId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AttendanceEntryFields on AttendanceEntry {\n    id\n    date\n    state\n    source\n    jobTitle\n    worker {\n      id\n      name\n      externalId\n    }\n    record {\n      id\n      checkInAt\n      checkOutAt\n      note\n    }\n    request {\n      id\n      status\n      type\n      note\n      createdAt\n      reviewedAt\n      reviewedBy {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment AttendanceEntryFields on AttendanceEntry {\n    id\n    date\n    state\n    source\n    jobTitle\n    worker {\n      id\n      name\n      externalId\n    }\n    record {\n      id\n      checkInAt\n      checkOutAt\n      note\n    }\n    request {\n      id\n      status\n      type\n      note\n      createdAt\n      reviewedAt\n      reviewedBy {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AttendanceFeed($locationId: ID!, $filter: AttendanceFilter) {\n    attendanceFeed(locationId: $locationId, filter: $filter) {\n      counts {\n        all\n        pending\n        present\n        off\n      }\n      entries {\n        ...AttendanceEntryFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query AttendanceFeed($locationId: ID!, $filter: AttendanceFilter) {\n    attendanceFeed(locationId: $locationId, filter: $filter) {\n      counts {\n        all\n        pending\n        present\n        off\n      }\n      entries {\n        ...AttendanceEntryFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LocationHeader($id: ID!) {\n    location(id: $id) {\n      id\n      name\n      selfCheckInEnabled\n      managerMarkingEnabled\n    }\n  }\n"): (typeof documents)["\n  query LocationHeader($id: ID!) {\n    location(id: $id) {\n      id\n      name\n      selfCheckInEnabled\n      managerMarkingEnabled\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OffBalance($locationId: ID!) {\n    offBalance(locationId: $locationId) {\n      year\n      allowance\n      used\n      remaining\n    }\n  }\n"): (typeof documents)["\n  query OffBalance($locationId: ID!) {\n    offBalance(locationId: $locationId) {\n      year\n      allowance\n      used\n      remaining\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LocationWorkers($locationId: ID!) {\n    locationWorkers(locationId: $locationId) {\n      jobTitle\n      user {\n        id\n        name\n        externalId\n      }\n    }\n  }\n"): (typeof documents)["\n  query LocationWorkers($locationId: ID!) {\n    locationWorkers(locationId: $locationId) {\n      jobTitle\n      user {\n        id\n        name\n        externalId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LocationsPage {\n    locations {\n      id\n      name\n      address\n      selfCheckInEnabled\n      managerMarkingEnabled\n      offDaysPerYear\n      workerCount\n      managerCount\n    }\n  }\n"): (typeof documents)["\n  query LocationsPage {\n    locations {\n      id\n      name\n      address\n      selfCheckInEnabled\n      managerMarkingEnabled\n      offDaysPerYear\n      workerCount\n      managerCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Approve($id: ID!) {\n    approveAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation Approve($id: ID!) {\n    approveAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Reject($id: ID!) {\n    rejectAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation Reject($id: ID!) {\n    rejectAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Cancel($id: ID!) {\n    cancelAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation Cancel($id: ID!) {\n    cancelAttendanceRequest(id: $id) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitRequest($input: SubmitAttendanceRequestInput!) {\n    submitAttendanceRequest(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation SubmitRequest($input: SubmitAttendanceRequestInput!) {\n    submitAttendanceRequest(input: $input) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkAttendance($input: MarkAttendanceInput!) {\n    markAttendance(input: $input) {\n      id\n      state\n    }\n  }\n"): (typeof documents)["\n  mutation MarkAttendance($input: MarkAttendanceInput!) {\n    markAttendance(input: $input) {\n      id\n      state\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetFlags($input: SetLocationFeatureFlagsInput!) {\n    setLocationFeatureFlags(input: $input) {\n      id\n      selfCheckInEnabled\n      managerMarkingEnabled\n    }\n  }\n"): (typeof documents)["\n  mutation SetFlags($input: SetLocationFeatureFlagsInput!) {\n    setLocationFeatureFlags(input: $input) {\n      id\n      selfCheckInEnabled\n      managerMarkingEnabled\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;