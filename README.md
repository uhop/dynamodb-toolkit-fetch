# dynamodb-toolkit-fetch [![NPM version][npm-img]][npm-url]

[npm-img]: https://img.shields.io/npm/v/dynamodb-toolkit-fetch.svg
[npm-url]: https://npmjs.org/package/dynamodb-toolkit-fetch

Fetch adapter for [`dynamodb-toolkit`](https://github.com/uhop/dynamodb-toolkit) v3. Serves the toolkit's standard REST route pack as a `(request: Request) => Promise<Response>` handler — same wire contract as `dynamodb-toolkit/handler` (the bundled `node:http` adapter), [`dynamodb-toolkit-koa`](https://github.com/uhop/dynamodb-toolkit-koa), and [`dynamodb-toolkit-express`](https://github.com/uhop/dynamodb-toolkit-express), translated for the Web Fetch handler shape.

Zero runtime dependencies. No framework peer dep — `Request` / `Response` / `URL` are platform primitives.

Runs on **Cloudflare Workers**, **Deno Deploy**, **Bun.serve**, **Hono**, **itty-router**, and Node 20+ servers that speak Fetch.

## Install

```sh
npm install dynamodb-toolkit-fetch dynamodb-toolkit @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

## Quick start

### Cloudflare Workers

```js
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {Adapter} from 'dynamodb-toolkit';
import {createFetchAdapter} from 'dynamodb-toolkit-fetch';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({region: 'us-east-1'}));
const planets = new Adapter({client, table: 'planets', keyFields: ['name']});

const handler = createFetchAdapter(planets, {mountPath: '/planets'});

export default {
  fetch: request => handler(request)
};
```

### Bun.serve / Deno.serve

```js
import {createFetchAdapter} from 'dynamodb-toolkit-fetch';

const handler = createFetchAdapter(planets, {mountPath: '/planets'});

// Bun
Bun.serve({port: 3000, fetch: handler});

// Deno
Deno.serve(handler);
```

### Hono / itty-router composition

`onMiss: () => null` lets the adapter yield control back to a parent router when the path isn't one of its own — the handler resolves to `null` and the router tries the next matcher.

```js
import {Hono} from 'hono';
import {createFetchAdapter} from 'dynamodb-toolkit-fetch';

const planetsHandler = createFetchAdapter(planets, {
  mountPath: '/planets',
  onMiss: () => null
});

const app = new Hono();
app.all('/planets/*', async c => (await planetsHandler(c.req.raw)) ?? c.notFound());
```

The adapter is terminal by default — if you omit `onMiss`, unknown routes become a plain `404 Response` so `Bun.serve`, `Deno.serve`, and `export default {fetch}` can return the handler directly with no wrapping.

## Options

| Option               | Default                                 | Purpose                                                               |
| -------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `policy`             | `defaultPolicy`                         | Partial overrides for prefixes, envelope keys, status codes.          |
| `sortableIndices`    | `{}`                                    | Map sort-field name → GSI name for `?sort=` / `?sort=-field`.         |
| `keyFromPath`        | `(raw, a) => ({[a.keyFields[0]]: raw})` | Convert `:key` path segment to a key object (composite keys).         |
| `exampleFromContext` | `() => ({})`                            | Derive `prepareListInput` `example` from `{query, body, adapter, framework: 'fetch', request}`. |
| `maxBodyBytes`       | `1048576` (1 MiB)                       | Cap for request bodies. Enforced via `Content-Length` + byte counter. |
| `mountPath`          | `''`                                    | Path prefix to strip before route matching (e.g. `/planets`).         |
| `onMiss`             | —                                       | Hook for unknown routes; return `null` to yield to a parent router.   |

Body size is enforced two ways: if the request declares a `Content-Length` above `maxBodyBytes`, the adapter rejects `413 PayloadTooLarge` before reading any bytes; otherwise it streams via `request.body.getReader()` with a running byte counter and rejects mid-stream if the cap is crossed — so chunked-encoded uploads can't smuggle past the header check.

## Routes

Rooted at `mountPath` (or at `/` when no mount is configured):

| Method | Path               | Adapter method                |
| ------ | ------------------ | ----------------------------- |
| GET    | `/`                | `getAll` (envelope + links)   |
| POST   | `/`                | `post`                        |
| DELETE | `/`                | `deleteAllByParams`           |
| GET    | `/-by-names`       | `getByKeys`                   |
| DELETE | `/-by-names`       | `deleteByKeys`                |
| PUT    | `/-load`           | `putAll`                      |
| PUT    | `/-clone`          | `cloneAllByParams` (overlay)  |
| PUT    | `/-move`           | `moveAllByParams` (overlay)   |
| PUT    | `/-clone-by-names` | `cloneByKeys` (overlay)       |
| PUT    | `/-move-by-names`  | `moveByKeys` (overlay)        |
| GET    | `/:key`            | `getByKey`                    |
| PUT    | `/:key`            | `put` (URL key merged in)     |
| PATCH  | `/:key`            | `patch` (meta keys → options) |
| DELETE | `/:key`            | `delete`                      |
| PUT    | `/:key/-clone`     | `clone`                       |
| PUT    | `/:key/-move`      | `move`                        |

Wire contract — query syntax, envelope shape, meta-key prefixes, status codes — matches the bundled [HTTP handler](https://github.com/uhop/dynamodb-toolkit/wiki/HTTP-handler). Everything is configurable through `options.policy`.

## Compatibility

- Any runtime with the standard Fetch API: **Cloudflare Workers**, **Deno Deploy**, **Bun.serve**, **Hono**, **itty-router**, **Node 20+**.
- No framework peer dep.
- `peerDependencies`: `dynamodb-toolkit ^3.1.1` only.

## License

[BSD-3-Clause](LICENSE).
