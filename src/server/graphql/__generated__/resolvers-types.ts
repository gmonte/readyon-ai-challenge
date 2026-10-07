import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { User as UserModel, Membership as MembershipModel } from '../../modules/identity/schemas';
import { Location as LocationModel } from '../../modules/locations/schemas';
import { AttendanceRecord as AttendanceRecordModel, AttendanceRequest as AttendanceRequestModel, AttendanceEntry as AttendanceEntryModel } from '../../modules/attendance/schemas';
import { GraphQLContext } from '../context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Calendar date, YYYY-MM-DD. All locations share one time zone. */
  Date: { input: string; output: string; }
  /** ISO 8601 timestamp with offset. */
  DateTime: { input: Date; output: Date | string; }
};

export type AttendanceCounts = {
  __typename?: 'AttendanceCounts';
  all: Scalars['Int']['output'];
  off: Scalars['Int']['output'];
  pending: Scalars['Int']['output'];
  present: Scalars['Int']['output'];
};

/** One row of the attendance table: a worker and a date, with the record and/or latest request. */
export type AttendanceEntry = {
  __typename?: 'AttendanceEntry';
  date: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  jobTitle?: Maybe<Scalars['String']['output']>;
  location: Location;
  record?: Maybe<AttendanceRecord>;
  request?: Maybe<AttendanceRequest>;
  /** Null while the entry exists only as a request ("on approval"). */
  source?: Maybe<AttendanceSource>;
  /** The record's state, or the requested type while no record exists. */
  state: AttendanceState;
  worker: User;
};

export type AttendanceFeed = {
  __typename?: 'AttendanceFeed';
  /** Counts over the unfiltered feed, for the filter chips. */
  counts: AttendanceCounts;
  entries: Array<AttendanceEntry>;
};

export enum AttendanceFilter {
  All = 'ALL',
  Off = 'OFF',
  Pending = 'PENDING',
  Present = 'PRESENT'
}

/** Actual attendance of one worker on one date. At most one per worker per date. */
export type AttendanceRecord = {
  __typename?: 'AttendanceRecord';
  checkInAt?: Maybe<Scalars['DateTime']['output']>;
  checkOutAt?: Maybe<Scalars['DateTime']['output']>;
  date: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  location: Location;
  /** Set when source is MANAGER. */
  markedBy?: Maybe<User>;
  note?: Maybe<Scalars['String']['output']>;
  /** Set when source is WORKER_REQUEST. */
  request?: Maybe<AttendanceRequest>;
  source: AttendanceSource;
  state: AttendanceState;
  updatedAt: Scalars['DateTime']['output'];
  worker: User;
};

/** A worker's ask to have a date recorded as PRESENT or OFF. One open request per worker per date. */
export type AttendanceRequest = {
  __typename?: 'AttendanceRequest';
  checkInAt?: Maybe<Scalars['DateTime']['output']>;
  checkOutAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  location: Location;
  note?: Maybe<Scalars['String']['output']>;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<User>;
  status: RequestStatus;
  type: AttendanceState;
  worker: User;
};

export enum AttendanceSource {
  Integration = 'INTEGRATION',
  Manager = 'MANAGER',
  WorkerRequest = 'WORKER_REQUEST'
}

export enum AttendanceState {
  Off = 'OFF',
  Present = 'PRESENT'
}

export type IntegrationAttendanceInput = {
  checkInAt?: InputMaybe<Scalars['DateTime']['input']>;
  checkOutAt?: InputMaybe<Scalars['DateTime']['input']>;
  date: Scalars['Date']['input'];
  /** The worker's external identifier, e.g. RO-1042. */
  externalId: Scalars['String']['input'];
  locationId: Scalars['ID']['input'];
  state: AttendanceState;
};

export type Location = {
  __typename?: 'Location';
  address: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  managerCount: Scalars['Int']['output'];
  /** When off, managers may only decide requests, not mark attendance directly. */
  managerMarkingEnabled: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** OFF allowance per worker per year, informational. */
  offDaysPerYear: Scalars['Int']['output'];
  /** When on, a worker's PRESENT request is approved automatically. */
  selfCheckInEnabled: Scalars['Boolean']['output'];
  workerCount: Scalars['Int']['output'];
};

export type LocationWorker = {
  __typename?: 'LocationWorker';
  jobTitle?: Maybe<Scalars['String']['output']>;
  user: User;
};

export type MarkAttendanceInput = {
  checkInAt?: InputMaybe<Scalars['DateTime']['input']>;
  checkOutAt?: InputMaybe<Scalars['DateTime']['input']>;
  date: Scalars['Date']['input'];
  locationId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  state: AttendanceState;
  workerId: Scalars['ID']['input'];
};

export type Membership = {
  __typename?: 'Membership';
  /** Workers only: exactly one job title per location. */
  jobTitle?: Maybe<Scalars['String']['output']>;
  location: Location;
};

export type Mutation = {
  __typename?: 'Mutation';
  _noop?: Maybe<Scalars['Boolean']['output']>;
  approveAttendanceRequest: AttendanceRequest;
  cancelAttendanceRequest: AttendanceRequest;
  /** Direct marking by a manager; gated by the location's Manager attendance marking flag. */
  markAttendance: AttendanceRecord;
  /** For third-party systems, authenticated with the x-api-key header. */
  recordIntegrationAttendance: AttendanceRecord;
  rejectAttendanceRequest: AttendanceRequest;
  setLocationFeatureFlags: Location;
  submitAttendanceRequest: AttendanceRequest;
};


export type MutationApproveAttendanceRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelAttendanceRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkAttendanceArgs = {
  input: MarkAttendanceInput;
};


export type MutationRecordIntegrationAttendanceArgs = {
  input: IntegrationAttendanceInput;
};


export type MutationRejectAttendanceRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSetLocationFeatureFlagsArgs = {
  input: SetLocationFeatureFlagsInput;
};


export type MutationSubmitAttendanceRequestArgs = {
  input: SubmitAttendanceRequestInput;
};

export type OffBalance = {
  __typename?: 'OffBalance';
  allowance: Scalars['Int']['output'];
  remaining: Scalars['Int']['output'];
  used: Scalars['Int']['output'];
  year: Scalars['Int']['output'];
};

/** Workforce Management gateway. One schema, assembled from the identity, locations and attendance modules. */
export type Query = {
  __typename?: 'Query';
  _health: Scalars['String']['output'];
  /** Workers get their own entries; managers and admins get everyone at the location. */
  attendanceFeed: AttendanceFeed;
  location: Location;
  locationWorkers: Array<LocationWorker>;
  /** Locations visible to the viewer: all for super admins, memberships otherwise. */
  locations: Array<Location>;
  /** The signed-in user (simulated auth via cookie), or null. */
  me?: Maybe<User>;
  /** Defaults to the viewer and the current year. Managers may ask about their workers. */
  offBalance: OffBalance;
  pendingRequestCount: Scalars['Int']['output'];
  /** One fixed user per role, for the "Viewing as" switcher. */
  personas: Array<User>;
};


/** Workforce Management gateway. One schema, assembled from the identity, locations and attendance modules. */
export type QueryAttendanceFeedArgs = {
  filter?: InputMaybe<AttendanceFilter>;
  locationId: Scalars['ID']['input'];
};


/** Workforce Management gateway. One schema, assembled from the identity, locations and attendance modules. */
export type QueryLocationArgs = {
  id: Scalars['ID']['input'];
};


/** Workforce Management gateway. One schema, assembled from the identity, locations and attendance modules. */
export type QueryLocationWorkersArgs = {
  locationId: Scalars['ID']['input'];
};


/** Workforce Management gateway. One schema, assembled from the identity, locations and attendance modules. */
export type QueryOffBalanceArgs = {
  locationId: Scalars['ID']['input'];
  workerId?: InputMaybe<Scalars['ID']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};


/** Workforce Management gateway. One schema, assembled from the identity, locations and attendance modules. */
export type QueryPendingRequestCountArgs = {
  locationId: Scalars['ID']['input'];
};

export enum RequestStatus {
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum Role {
  Manager = 'MANAGER',
  SuperAdmin = 'SUPER_ADMIN',
  Worker = 'WORKER'
}

export type SetLocationFeatureFlagsInput = {
  locationId: Scalars['ID']['input'];
  managerMarkingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  selfCheckInEnabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SubmitAttendanceRequestInput = {
  checkInAt?: InputMaybe<Scalars['DateTime']['input']>;
  checkOutAt?: InputMaybe<Scalars['DateTime']['input']>;
  date: Scalars['Date']['input'];
  locationId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  type: AttendanceState;
};

export type User = {
  __typename?: 'User';
  /** Only workers have one. Third parties identify workers by it. */
  externalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  memberships: Array<Membership>;
  name: Scalars['String']['output'];
  role: Role;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AttendanceCounts: ResolverTypeWrapper<AttendanceCounts>;
  AttendanceEntry: ResolverTypeWrapper<AttendanceEntryModel>;
  AttendanceFeed: ResolverTypeWrapper<Omit<AttendanceFeed, 'entries'> & { entries: Array<ResolversTypes['AttendanceEntry']> }>;
  AttendanceFilter: AttendanceFilter;
  AttendanceRecord: ResolverTypeWrapper<AttendanceRecordModel>;
  AttendanceRequest: ResolverTypeWrapper<AttendanceRequestModel>;
  AttendanceSource: AttendanceSource;
  AttendanceState: AttendanceState;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  IntegrationAttendanceInput: IntegrationAttendanceInput;
  Location: ResolverTypeWrapper<LocationModel>;
  LocationWorker: ResolverTypeWrapper<Omit<LocationWorker, 'user'> & { user: ResolversTypes['User'] }>;
  MarkAttendanceInput: MarkAttendanceInput;
  Membership: ResolverTypeWrapper<MembershipModel>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  OffBalance: ResolverTypeWrapper<OffBalance>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RequestStatus: RequestStatus;
  Role: Role;
  SetLocationFeatureFlagsInput: SetLocationFeatureFlagsInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  SubmitAttendanceRequestInput: SubmitAttendanceRequestInput;
  User: ResolverTypeWrapper<UserModel>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AttendanceCounts: AttendanceCounts;
  AttendanceEntry: AttendanceEntryModel;
  AttendanceFeed: Omit<AttendanceFeed, 'entries'> & { entries: Array<ResolversParentTypes['AttendanceEntry']> };
  AttendanceRecord: AttendanceRecordModel;
  AttendanceRequest: AttendanceRequestModel;
  Boolean: Scalars['Boolean']['output'];
  Date: Scalars['Date']['output'];
  DateTime: Scalars['DateTime']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  IntegrationAttendanceInput: IntegrationAttendanceInput;
  Location: LocationModel;
  LocationWorker: Omit<LocationWorker, 'user'> & { user: ResolversParentTypes['User'] };
  MarkAttendanceInput: MarkAttendanceInput;
  Membership: MembershipModel;
  Mutation: Record<PropertyKey, never>;
  OffBalance: OffBalance;
  Query: Record<PropertyKey, never>;
  SetLocationFeatureFlagsInput: SetLocationFeatureFlagsInput;
  String: Scalars['String']['output'];
  SubmitAttendanceRequestInput: SubmitAttendanceRequestInput;
  User: UserModel;
}>;

export type AttendanceCountsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AttendanceCounts'] = ResolversParentTypes['AttendanceCounts']> = ResolversObject<{
  all?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  off?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pending?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  present?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type AttendanceEntryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AttendanceEntry'] = ResolversParentTypes['AttendanceEntry']> = ResolversObject<{
  date?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  jobTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  location?: Resolver<ResolversTypes['Location'], ParentType, ContextType>;
  record?: Resolver<Maybe<ResolversTypes['AttendanceRecord']>, ParentType, ContextType>;
  request?: Resolver<Maybe<ResolversTypes['AttendanceRequest']>, ParentType, ContextType>;
  source?: Resolver<Maybe<ResolversTypes['AttendanceSource']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['AttendanceState'], ParentType, ContextType>;
  worker?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
}>;

export type AttendanceFeedResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AttendanceFeed'] = ResolversParentTypes['AttendanceFeed']> = ResolversObject<{
  counts?: Resolver<ResolversTypes['AttendanceCounts'], ParentType, ContextType>;
  entries?: Resolver<Array<ResolversTypes['AttendanceEntry']>, ParentType, ContextType>;
}>;

export type AttendanceRecordResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AttendanceRecord'] = ResolversParentTypes['AttendanceRecord']> = ResolversObject<{
  checkInAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  checkOutAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  date?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  location?: Resolver<ResolversTypes['Location'], ParentType, ContextType>;
  markedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  request?: Resolver<Maybe<ResolversTypes['AttendanceRequest']>, ParentType, ContextType>;
  source?: Resolver<ResolversTypes['AttendanceSource'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['AttendanceState'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  worker?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
}>;

export type AttendanceRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AttendanceRequest'] = ResolversParentTypes['AttendanceRequest']> = ResolversObject<{
  checkInAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  checkOutAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  location?: Resolver<ResolversTypes['Location'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  reviewedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  reviewedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['RequestStatus'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AttendanceState'], ParentType, ContextType>;
  worker?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type LocationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Location'] = ResolversParentTypes['Location']> = ResolversObject<{
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  managerCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  managerMarkingEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  offDaysPerYear?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  selfCheckInEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  workerCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type LocationWorkerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LocationWorker'] = ResolversParentTypes['LocationWorker']> = ResolversObject<{
  jobTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
}>;

export type MembershipResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Membership'] = ResolversParentTypes['Membership']> = ResolversObject<{
  jobTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  location?: Resolver<ResolversTypes['Location'], ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  _noop?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  approveAttendanceRequest?: Resolver<ResolversTypes['AttendanceRequest'], ParentType, ContextType, RequireFields<MutationApproveAttendanceRequestArgs, 'id'>>;
  cancelAttendanceRequest?: Resolver<ResolversTypes['AttendanceRequest'], ParentType, ContextType, RequireFields<MutationCancelAttendanceRequestArgs, 'id'>>;
  markAttendance?: Resolver<ResolversTypes['AttendanceRecord'], ParentType, ContextType, RequireFields<MutationMarkAttendanceArgs, 'input'>>;
  recordIntegrationAttendance?: Resolver<ResolversTypes['AttendanceRecord'], ParentType, ContextType, RequireFields<MutationRecordIntegrationAttendanceArgs, 'input'>>;
  rejectAttendanceRequest?: Resolver<ResolversTypes['AttendanceRequest'], ParentType, ContextType, RequireFields<MutationRejectAttendanceRequestArgs, 'id'>>;
  setLocationFeatureFlags?: Resolver<ResolversTypes['Location'], ParentType, ContextType, RequireFields<MutationSetLocationFeatureFlagsArgs, 'input'>>;
  submitAttendanceRequest?: Resolver<ResolversTypes['AttendanceRequest'], ParentType, ContextType, RequireFields<MutationSubmitAttendanceRequestArgs, 'input'>>;
}>;

export type OffBalanceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['OffBalance'] = ResolversParentTypes['OffBalance']> = ResolversObject<{
  allowance?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  remaining?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  used?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  _health?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  attendanceFeed?: Resolver<ResolversTypes['AttendanceFeed'], ParentType, ContextType, RequireFields<QueryAttendanceFeedArgs, 'filter' | 'locationId'>>;
  location?: Resolver<ResolversTypes['Location'], ParentType, ContextType, RequireFields<QueryLocationArgs, 'id'>>;
  locationWorkers?: Resolver<Array<ResolversTypes['LocationWorker']>, ParentType, ContextType, RequireFields<QueryLocationWorkersArgs, 'locationId'>>;
  locations?: Resolver<Array<ResolversTypes['Location']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  offBalance?: Resolver<ResolversTypes['OffBalance'], ParentType, ContextType, RequireFields<QueryOffBalanceArgs, 'locationId'>>;
  pendingRequestCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryPendingRequestCountArgs, 'locationId'>>;
  personas?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  externalId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  memberships?: Resolver<Array<ResolversTypes['Membership']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  AttendanceCounts?: AttendanceCountsResolvers<ContextType>;
  AttendanceEntry?: AttendanceEntryResolvers<ContextType>;
  AttendanceFeed?: AttendanceFeedResolvers<ContextType>;
  AttendanceRecord?: AttendanceRecordResolvers<ContextType>;
  AttendanceRequest?: AttendanceRequestResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  Location?: LocationResolvers<ContextType>;
  LocationWorker?: LocationWorkerResolvers<ContextType>;
  Membership?: MembershipResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  OffBalance?: OffBalanceResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
}>;

