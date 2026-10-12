import {
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	STATE_COOKIE,
	clearCookie,
	cookie,
	readCookie,
	sealSession,
} from '../../../src/lib/contribute/session.ts';

interface Env {
	GITHUB_OAUTH_CLIENT_ID?: string;
	GITHUB_OAUTH_CLIENT_SECRET?: string;
	SESSION_SECRET?: string;
}

const backToForm = (request: Request, status: string, extraCookie?: string) => {
	const headers = new Headers({ location: new URL(`/contribute/?github=${status}`, request.url).toString() });
	headers.append('set-cookie', clearCookie(STATE_COOKIE));
	if (extraCookie) headers.append('set-cookie', extraCookie);
	return new Response(null, { status: 302, headers });
};

// GitHub sends the contributor back here. The code becomes a token, which is
// sealed into the session cookie together with who they are.
export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
	if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET || !env.SESSION_SECRET) {
		return backToForm(request, 'unavailable');
	}
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code || !state || state !== readCookie(request.headers.get('cookie'), STATE_COOKIE)) {
		return backToForm(request, 'failed');
	}

	const exchange = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { accept: 'application/json', 'content-type': 'application/json' },
		body: JSON.stringify({
			client_id: env.GITHUB_OAUTH_CLIENT_ID,
			client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
			code,
			redirect_uri: new URL('/api/github/callback', request.url).toString(),
		}),
	});
	const tokenData = (await exchange.json().catch(() => ({}))) as { access_token?: string };
	if (!tokenData.access_token) return backToForm(request, 'failed');

	const me = await fetch('https://api.github.com/user', {
		headers: {
			authorization: `Bearer ${tokenData.access_token}`,
			accept: 'application/vnd.github+json',
			'user-agent': 'queue-free-contribute',
		},
	});
	const user = (await me.json().catch(() => ({}))) as { login?: string; avatar_url?: string };
	if (!user.login) return backToForm(request, 'failed');

	const sealed = await sealSession(env.SESSION_SECRET, {
		token: tokenData.access_token,
		login: user.login,
		avatar: user.avatar_url ?? '',
	});
	return backToForm(request, 'ok', cookie(SESSION_COOKIE, sealed, SESSION_MAX_AGE));
}
