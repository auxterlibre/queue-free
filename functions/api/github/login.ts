import { STATE_COOKIE, cookie } from '../../../src/lib/contribute/session.ts';

interface Env {
	GITHUB_OAUTH_CLIENT_ID?: string;
	GITHUB_OAUTH_CLIENT_SECRET?: string;
	SESSION_SECRET?: string;
}

// Sends the contributor to GitHub to approve the contribute form. The state
// cookie ties the callback to this browser.
export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
	if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET || !env.SESSION_SECRET) {
		return new Response('GitHub sign-in is not set up on this deployment.', { status: 503 });
	}
	const state = crypto.randomUUID();
	const callback = new URL('/api/github/callback', request.url).toString();
	const authorize = new URL('https://github.com/login/oauth/authorize');
	authorize.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID);
	authorize.searchParams.set('redirect_uri', callback);
	authorize.searchParams.set('scope', 'public_repo');
	authorize.searchParams.set('state', state);
	return new Response(null, {
		status: 302,
		headers: { location: authorize.toString(), 'set-cookie': cookie(STATE_COOKIE, state, 600) },
	});
}
