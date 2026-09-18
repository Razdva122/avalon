'use strict';

// Private Node.js 22 Cloud Function; entry point index.handler.
// Data Streams invokes it with { messages: [<Postbox event>, ...] }.
exports.handler = async (event) => {
  const url = process.env.MAIL_EVENT_URL;
  const secret = process.env.MAIL_EVENT_SECRET;
  if (url !== 'https://avalon-game.com/api/auth/mail-events' || !secret) {
    throw new Error('invalid_configuration');
  }
  if (!Array.isArray(event?.messages)) throw new Error('invalid_event');
  for (const message of event.messages) {
    const kind = message?.eventType;
    const bounce = kind === 'Bounce' && message.bounce?.bounceType === 'Permanent';
    if (!bounce && kind !== 'Complaint') continue;
    const recipients = bounce ? message.bounce.bouncedRecipients : message.complaint?.complainedRecipients;
    if (!Array.isArray(recipients) || !recipients.length) throw new Error('invalid_event');
    for (const recipient of recipients) {
      const address = recipient?.emailAddress;
      if (typeof address !== 'string' || address.length > 254 || !address.includes('@')) {
        throw new Error('invalid_event');
      }
      // One recipient per request: below the backend's 4 KB limit, no mail contents.
      const minimal = bounce
        ? { eventType: kind, bounce: { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: address }] } }
        : { eventType: kind, complaint: { complainedRecipients: [{ emailAddress: address }] } };
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
          body: JSON.stringify(minimal),
          redirect: 'error',
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error('rejected');
        await response.body?.cancel();
      } catch {
        // Trigger retries; never log recipient, secret, provider payload or response.
        throw new Error('mail_event_delivery_failed');
      }
    }
  }
  return { statusCode: 200 };
};
