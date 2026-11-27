const test = require('node:test');
const assert = require('node:assert/strict');
const { requireAdmin } = require('../src/middleware/auth');

function responseStub() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('rejects requests without an administrator role', () => {
  for (const user of [undefined, { role: 'customer' }]) {
    const res = responseStub();
    let nextCalled = false;

    requireAdmin({ user }, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: 'Administrator access required' });
    assert.equal(nextCalled, false);
  }
});

test('allows requests with an administrator role', () => {
  const res = responseStub();
  let nextCalled = false;

  requireAdmin({ user: { role: 'admin' } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
