const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('./index.js');
const bounce = {
  eventType: 'Bounce',
  bounce: {
    bounceType: 'Permanent',
    bouncedRecipients: [{ emailAddress: 'a@example.com' }, { emailAddress: 'b@example.com' }],
  },
  mail: { subject: 'private' },
};
process.env.MAIL_EVENT_URL = 'https://avalon-game.com/api/auth/mail-events';
process.env.MAIL_EVENT_SECRET = 'test-secret-not-for-production';
test('splits YDS events into minimal authenticated requests', async () => {
  const received = [];
  const previous = global.fetch;
  global.fetch = async (url, options) => {
    received.push({ url, ...options });
    return { ok: true };
  };
  try {
    await handler({ messages: [bounce, { eventType: 'Delivery' }] });
    assert.equal(received.length, 2);
    assert.equal(received[0].url, process.env.MAIL_EVENT_URL);
    assert.equal(received[0].headers.Authorization, `Bearer ${process.env.MAIL_EVENT_SECRET}`);
    assert.deepEqual(JSON.parse(received[0].body), {
      eventType: 'Bounce',
      bounce: { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: 'a@example.com' }] },
    });
    assert.equal(received[0].redirect, 'error');
  } finally {
    global.fetch = previous;
  }
});
test('rejects failed delivery so trigger can retry without exposing body', async () => {
  const previous = global.fetch;
  global.fetch = async () => ({ ok: false, status: 503 });
  try {
    await assert.rejects(handler({ messages: [bounce] }), /^Error: mail_event_delivery_failed$/);
  } finally {
    global.fetch = previous;
  }
});
test('ignores transient bounce and forwards complaints', async () => {
  const received = [];
  const previous = global.fetch;
  global.fetch = async (_url, options) => {
    received.push(JSON.parse(options.body));
    return { ok: true };
  };
  try {
    await handler({
      messages: [
        { eventType: 'Bounce', bounce: { bounceType: 'Transient' } },
        { eventType: 'Complaint', complaint: { complainedRecipients: [{ emailAddress: 'c@example.com' }] } },
      ],
    });
    assert.deepEqual(received, [
      { eventType: 'Complaint', complaint: { complainedRecipients: [{ emailAddress: 'c@example.com' }] } },
    ]);
  } finally {
    global.fetch = previous;
  }
});
test('rejects malformed envelope and recipient', async () => {
  await assert.rejects(handler({}), /invalid_event/);
  await assert.rejects(
    handler({ messages: [{ eventType: 'Complaint', complaint: { complainedRecipients: [{}] } }] }),
    /invalid_event/,
  );
});
