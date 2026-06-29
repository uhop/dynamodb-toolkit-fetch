# Architecture — dynamodb-toolkit-fetch

Internal layout and design notes for maintainers. Consumer-facing docs live in the [wiki](https://github.com/uhop/dynamodb-toolkit-fetch/wiki); the machine-readable API reference is in `llms.txt` / `llms-full.txt`.

## Shape

ESM-only JavaScript with a hand-written `.d.ts` sidecar next to every `.js` — no build step, no transpiler. Zero runtime dependencies; `dynamodb-toolkit` is the only peer dependency. There is no framework peer dep — `Request` / `Response` / `URL` / `ReadableStream` / `TextDecoder` are platform primitives on every target runtime (Cloudflare Workers, Deno Deploy, Bun.serve, Node 20+). Each `.js` opens with a `// @ts-self-types="./<file>.d.ts"` directive so its sibling `.d.ts` is the sole source of types and docs; `.js` files hold no JSDoc beyond the load-bearing inline `/** @type */` annotations the implementation needs to type-check (the `ListOptions` and write-body casts in `index.js`).

A Fetch adapter, not a framework. All parsing, envelope building, policy merging, and route-shape matching are delegated to the parent toolkit; this package owns only the `Request` → `Response` translation and error mapping.

## Composition

`createFetchAdapter(adapter, options)` is the single public entry. It closes over the merged `policy`, `sortableIndices`, `keyFromPath` / `exampleFromContext` extractors, `maxBodyBytes`, `mountPath`, and the optional `onMiss` hook, then returns one `(request: Request) => Promise<Response>` handler. The returned function is the whole runtime surface — there is no per-request object construction beyond the closures.

Delegation targets in the parent:

| Import                                                                                                                                                                      | Responsibility                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `dynamodb-toolkit/rest-core` (`parse*`, `build*`, `mergePolicy`, `mapErrorStatus`, `resolveSort`, `stripMount`, `validateWriteBody`, `paginationLinks`, `buildListOptions`) | Framework-agnostic REST primitives — parsers, builders, policy, mount stripping, DoS gates. |
| `dynamodb-toolkit/handler` (`matchRoute`)                                                                                                                                   | Route-shape matching (`HEAD → GET` auto-promote).                                           |
| consumer-supplied `Adapter`                                                                                                                                                 | The DynamoDB layer — `getList` / `getByKey` / `put` / `patch` / mass ops.                   |

The streaming body reader is **not** imported from the parent — `read-web-body.js` is a Fetch-native reimplementation, because the parent's `readJsonBody` is built on the Node `IncomingMessage` stream interface, which does not exist on Workers / Deno / Bun.

## Dispatch

The returned handler builds a `URL` from `request.url`, coerces the query (`coerceSearchParams` — first value wins per repeated key, matching koa / express), then `stripMount(pathname, mountPath)` resolves the residual path. A `null` residual (request outside the mount) funnels to `handleMiss`. Otherwise `matchRoute(request.method, adapterPath, policy.methodPrefix)` classifies the request into one of four `route.kind` buckets:

- `root` — `GET` / `POST` / `DELETE /` → list / post / `deleteListByParams`.
- `collectionMethod` — the `-by-names`, `-load`, `-clone` / `-move`, `-clone-by-names` / `-move-by-names` endpoints.
- `item` — `GET` / `PUT` / `PATCH` / `DELETE /:key` (the `:key` segment runs through `keyFromPath`).
- `itemMethod` — single-item `PUT /:key/-clone`, `PUT /:key/-move`.

Two non-handler outcomes, both routed through the unified `handleMiss(request)`:

- **Outside mount or unknown route shape** → `handleMiss`. With no `onMiss`, returns a terminal `404`. `onMiss(request)` optionally widens: a `Response` is returned as-is; `null` is returned verbatim (the caller falls through to the next matcher under Hono / itty-router / a Workers dispatch); `undefined` falls back to the default `404`. The TS return type narrows accordingly — `Promise<Response | null>` when `onMiss` is supplied, `Promise<Response>` otherwise — expressed as two function overloads in `index.d.ts`.
- **Known shape, unsupported method** → explicit `405 Method Not Allowed`.

## Request handling

- **Body** — `read-web-body.js`'s `readJsonBody` uses a hybrid strategy: if `Content-Length` is declared and exceeds `maxBodyBytes` (1 MiB default), reject `413` before touching the stream; otherwise stream via `request.body.getReader()` with a running byte counter, rejecting `413` mid-stream once the cap is crossed (covers chunked transfer and CL-liars). A malformed `Content-Length` is `400 BadContentLength`; invalid JSON is `400 BadJsonBody`; an empty body resolves to `null`. The oversize reader is `cancel()`-ed (errors swallowed) so the runtime can release socket buffers.
- **Responses** — `jsonResponse` for bodies; `emptyResponse(status)` builds `new Response(null, {status})` so a configured status ships with a genuinely empty body (Fetch has no Koa-style null-body → 204 coercion to work around). The only response header the adapter sets is `content-type: application/json; charset=utf-8` — no CORS / cache / security headers; consumers wrap the handler for those. `errorResponse` maps through `policy.errorBody` + `mapErrorStatus`, honoring an explicit `err.status` in the 4xx/5xx range.
- **Pagination** — `urlBuilderFor` clones the caller's `request.url` and rewrites only `offset` / `limit`, preserving the mount prefix, other query params, and casing so next/prev links point back at the endpoint the client actually hit.

The wire contract — routes, envelope, status codes, option shape — matches the bundled `node:http` handler (`dynamodb-toolkit/handler`) and the sibling `dynamodb-toolkit-koa` / `dynamodb-toolkit-express` / `dynamodb-toolkit-lambda` adapters; only the I/O translation differs.

## Layout

```
src/
  index.js            # createFetchAdapter — the single handler factory
  index.d.ts          # Type + doc sidecar (sole source of types and docs)
  read-web-body.js    # Fetch-native streaming JSON body reader (413/400 gates)
  read-web-body.d.ts
tests/                # Unit + mock-based tests (tape-six); fake Request fixtures
llms.txt              # Machine-readable API reference (consumer-facing)
llms-full.txt
wiki/                 # Published wiki — git submodule
```

The published tarball ships `src/`, `README.md`, `LICENSE`, `llms.txt`, `llms-full.txt`, `package.json`. Tests, AI-rule files, and the wiki stay out (verify via `npm pack --dry-run`).
