// dynamodb-toolkit Fetch adapter — main entry.
// Translates the Web Fetch handler shape into rest-core parsers + matchRoute + standard route pack.
//
// Design outline (to implement):
//   createFetchAdapter(adapter, options?) → (request: Request) => Promise<Response>
//     - parse request.method + URL pathname (stripped of options.mountPath) via matchRoute
//     - drive request.json() / URL.searchParams through rest-core parsers
//     - dispatch to the supplied dynamodb-toolkit Adapter
//     - build Response via new Response(JSON.stringify(body), {status, headers}) using rest-core builders + policy
//
// Reference: dynamodb-toolkit-express@0.1.0 src/index.js — structurally parallel,
// same matchRoute / rest-core plumbing, different I/O shim. Fetch differs from
// Node-stream adapters in two important ways: Request bodies are consumed via
// `request.text()` / `request.json()` (no chunked streaming helper needed), and
// Response is constructed new on each dispatch (no mutable res object to pass
// around).
