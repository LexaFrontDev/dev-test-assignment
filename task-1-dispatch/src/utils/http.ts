import type { ServerResponse } from 'node:http';

export function send(res: ServerResponse, status: number, body: unknown,): void {
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
    });

    res.end(JSON.stringify(body));
}