# dynamodb-toolkit-fetch [![NPM version][npm-img]][npm-url]

[npm-img]: https://img.shields.io/npm/v/dynamodb-toolkit-fetch.svg
[npm-url]: https://npmjs.org/package/dynamodb-toolkit-fetch

> **Superseded.** The Fetch adapter now ships inside [`dynamodb-toolkit`](https://github.com/uhop/dynamodb-toolkit) as the **`dynamodb-toolkit/fetch`** subpath export (3.8.0+). This package is a **frozen re-export thunk**: it keeps existing consumers working unchanged and receives no further development. The repository is archived.

## Migration

Change the import — nothing else:

```diff
-import {createFetchAdapter} from 'dynamodb-toolkit-fetch';
+import {createFetchAdapter} from 'dynamodb-toolkit/fetch';
```

The body reader moved with it: `dynamodb-toolkit-fetch/read-web-body.js` → `dynamodb-toolkit/http/fetch/read-web-body.js`. Then drop `dynamodb-toolkit-fetch` from your `package.json`. The API, options, and wire contract are identical — the code simply lives in the core package now; it runs on Cloudflare Workers, Deno Deploy, Bun.serve, Hono, and Node's native fetch server as before.

## What this thunk is

`export * from 'dynamodb-toolkit/fetch'` — nothing else. It declares an open-ended peer on `dynamodb-toolkit >= 3.8.0`, so future core releases never require a thunk update.

Documentation lives in the core wiki: [Framework adapters](https://github.com/uhop/dynamodb-toolkit/wiki/Framework-adapters) (shared surface) and [Fetch adapter](https://github.com/uhop/dynamodb-toolkit/wiki/Fetch-adapter).

## Release notes

- 0.4.0 _Frozen re-export thunk over `dynamodb-toolkit/fetch`; superseded by the core subpath. No API changes._
- 0.3.0 _Standalone adapter line (final implementation release); see the core wiki for current docs._

Full details in the wiki's [Release notes](https://github.com/uhop/dynamodb-toolkit-fetch/wiki/Release-notes).

## License

[BSD-3-Clause](LICENSE).
