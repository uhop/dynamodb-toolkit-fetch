// @ts-self-types="./index.d.ts"
// Frozen re-export thunk. The Fetch adapter moved into dynamodb-toolkit as
// the `dynamodb-toolkit/fetch` subpath export (3.8.0) — new code should
// import the subpath directly. This thunk keeps existing consumers working
// unchanged and receives no further development.

export * from 'dynamodb-toolkit/fetch';
