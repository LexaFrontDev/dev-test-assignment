import { createServer, type ServerResponse } from 'node:http';
import { branches, orders } from './store.ts';
import {assignOrder, assignOrderController} from './controllers/order.controller.ts';
import { getBranchLoad } from './controllers/branch.controller.ts';
import { send } from './utils/http.ts';

const port = Number(process.env.PORT ?? 3001);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);

  try {
    if (
        req.method === 'POST' &&
        parts[0] === 'orders' &&
        parts[2] === 'assign' &&
        parts.length === 3
    ) {
      return assignOrderController(parts[1], res);
    }

    if (
        req.method === 'GET' &&
        parts[0] === 'branches' &&
        parts[2] === 'load' &&
        parts.length === 3
    ) {
      return getBranchLoad(
          parts[1],
          url.searchParams.get('date'),
          res,
      );
    }

    if (req.method === 'GET' && url.pathname === '/branches') {
      return send(res, 200, branches);
    }

    if (req.method === 'GET' && parts[0] === 'orders' && parts.length === 2) {
      const order = orders.find((o) => o.id === parts[1]);
      if (!order) return send(res, 404, { error: 'order_not_found' });
      return send(res, 200, order);
    }

    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'internal' });
  }
});


server.listen(port, () => {
  console.log(`dispatch: http://localhost:${port}`);
});
