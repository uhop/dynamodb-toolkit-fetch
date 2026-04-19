# dynamodb-toolkit-fetch [![NPM version][npm-img]][npm-url]

[npm-img]: https://img.shields.io/npm/v/dynamodb-toolkit-fetch.svg
[npm-url]: https://npmjs.org/package/dynamodb-toolkit-fetch

Fetch adapter for [`dynamodb-toolkit`](https://github.com/uhop/dynamodb-toolkit) v3. Serves the toolkit's standard REST route pack as a `(request: Request) => Promise<Response>` handler — same wire contract as `dynamodb-toolkit/handler` (the bundled `node:http` adapter), [`dynamodb-toolkit-koa`](https://github.com/uhop/dynamodb-toolkit-koa), and [`dynamodb-toolkit-express`](https://github.com/uhop/dynamodb-toolkit-express), translated for the Web Fetch handler shape.

Runs anywhere with standard Fetch APIs: **Cloudflare Workers**, **Deno Deploy**, **Bun.serve**, **Hono**, **itty-router**, **Node's native `fetch` server**.

> **Status: scaffolding.** Implementation to follow. Sibling packages `dynamodb-toolkit-koa@0.1.0` and `dynamodb-toolkit-express@0.1.0` are the structural reference.

## Install

```sh
npm install dynamodb-toolkit-fetch dynamodb-toolkit @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

`dynamodb-toolkit` is declared as a **peer dependency**. There is no framework peer dep — `Request` / `Response` / `URL` are platform primitives.

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
  fetch(request) {
    return handler(request);
  }
};
```

### Bun.serve

```js
import {createFetchAdapter} from 'dynamodb-toolkit-fetch';

const handler = createFetchAdapter(planets, {mountPath: '/planets'});
Bun.serve({port: 3000, fetch: handler});
```

### Hono

```js
import {Hono} from 'hono';
import {createFetchAdapter} from 'dynamodb-toolkit-fetch';

const handler = createFetchAdapter(planets);

const app = new Hono();
app.all('/planets/*', c => handler(c.req.raw));
```

### Deno Deploy

```ts
import {createFetchAdapter} from 'dynamodb-toolkit-fetch';

const handler = createFetchAdapter(planets, {mountPath: '/planets'});
Deno.serve(handler);
```

The adapter serves the [standard route pack](https://github.com/uhop/dynamodb-toolkit/wiki/HTTP-handler) — envelope keys, status codes, and prefixes all configurable via `options.policy`.

## Compatibility

- **Any runtime with standard Fetch APIs.** No framework peer dep.
- **Node 20+**, **Bun**, **Deno**, **Cloudflare Workers**, **Deno Deploy** — tested across all where tape-six runs.

## License

[BSD-3-Clause](LICENSE).
