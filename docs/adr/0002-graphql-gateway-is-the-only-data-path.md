# The GraphQL gateway is the only data path, including for the Next.js UI

The frontend must talk exclusively to the GraphQL gateway, and in Next.js 16 the obvious route is Server Components reading the database directly. We deliberately don't do that: all pages are client components using urql against `/api/graphql`, and the only server-side code outside the gateway is a Server Action that sets the simulated-auth cookie. Next.js docs also warn against Server Components fetching the app's own route handlers, so going "through GraphQL" from RSC would need an in-process execute path, a second code path we chose not to maintain.

**Consequence**: the Next.js server is a thin host for the gateway and static shell. Swapping it for a standalone GraphQL server or a federated gateway changes one route file.
