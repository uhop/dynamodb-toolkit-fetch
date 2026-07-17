import test from 'tape-six';

import * as thunk from 'dynamodb-toolkit-fetch';
import * as core from 'dynamodb-toolkit/fetch';
import * as thunkBody from 'dynamodb-toolkit-fetch/read-web-body.js';
import * as coreBody from 'dynamodb-toolkit/http/fetch/read-web-body.js';

test('thunk: re-exports the dynamodb-toolkit/fetch surface verbatim', t => {
  t.deepEqual(Object.keys(thunk).sort(), Object.keys(core).sort(), 'same export surface');
  for (const key of Object.keys(core)) {
    t.equal(thunk[key], core[key], `same identity: ${key}`);
  }
});

test('thunk: read-web-body.js path re-exports the core module', t => {
  t.deepEqual(Object.keys(thunkBody).sort(), Object.keys(coreBody).sort(), 'same export surface');
  t.equal(thunkBody.readJsonBody, coreBody.readJsonBody, 'same identity: readJsonBody');
});
