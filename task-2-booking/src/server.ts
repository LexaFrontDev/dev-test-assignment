import { send } from './utils/http.ts';
import { createServer, type IncomingMessage } from 'node:http';
import { masters, services } from './store.ts';
import { getMasterSlots } from './controllers/master.controller.ts';
import { createBookingController } from './controllers/booking.controller.ts';

const port = Number(process.env.PORT ?? 3002);

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  try {
    const slotsMatch = url.pathname.match(/^\/masters\/([^/]+)\/slots$/);

    if (req.method === 'GET' && slotsMatch) {
      const result = await getMasterSlots(
          slotsMatch[1],
          url.searchParams
      );

      return send(res, result.status, result.body);
    }

    if (req.method === 'POST' && url.pathname === '/bookings') {
      try {
        const body = await readJson(req);
        const result = await createBookingController(body);

        return send(res, result.status, result.body);
      } catch (err) {
        if (err instanceof SyntaxError) {
          return send(res, 400, { error: 'invalid_body' });
        }

        throw err;
      }
    }

    if (req.method === 'GET' && url.pathname === '/masters') {
      return send(res, 200, masters);
    }

    if (req.method === 'GET' && url.pathname === '/services') {
      return send(res, 200, services);
    }

    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'internal' });
  }
});

async function readJson(req: IncomingMessage): Promise<unknown> {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : null;
}


server.listen(port, () => {
  console.log(`booking: http://localhost:${port}`);
});
