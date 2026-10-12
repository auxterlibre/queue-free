import { openSession } from '../../../src/lib/contribute/session.ts';

interface Env {
	GITHUB_OAUTH_CLIENT_ID?: string;
	GITHUB_OAUTH_CLIENT_SECRET?: string;
	SESSION_SECRET?: string;
}

// Tells the form whether sign-in exists on this deployment and who, if
// anyone, is signed in. Never returns the token.
export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
	const available = Boolean(env.GITHUB_OAUTH_CLIENT_ID && env.GITHUB_OAUTH_CLIENT_SECRET && env.SESSION_SECRET);
	const session = available ? await openSession(env.SESSION_SECRET!, request.headers.get('cookie')) : null;
	return new Response(JSON.stringify({ available, user: session ? { login: session.login, avatar: session.avatar } : null }), {
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	});
}
