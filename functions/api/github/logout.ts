import { SESSION_COOKIE, clearCookie } from '../../../src/lib/contribute/session.ts';

export async function onRequestPost(): Promise<Response> {
	return new Response(JSON.stringify({ ok: true }), {
		headers: { 'content-type': 'application/json', 'set-cookie': clearCookie(SESSION_COOKIE) },
	});
}
