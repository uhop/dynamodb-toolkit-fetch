import test from 'tape-six';

test('smoke: package loads', async t => {
  const pkg = await import('dynamodb-toolkit-fetch');
  t.ok(pkg, 'package resolves');
});
