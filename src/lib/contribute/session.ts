// The GitHub sign-in session for the contribute form: a small AES-GCM sealed
// cookie holding the contributor's token and login. Server-side only.

export interface GithubSession {
	token: string;
	login: string;
	avatar: string;
}

export const SESSION_COOKIE = 'qf_gh';
export const STATE_COOKIE = 'qf_gh_state';
export const SESSION_MAX_AGE = 8 * 60 * 60;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (text: string) =>
	Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function sessionKey(secret: string): Promise<CryptoKey> {
	const raw = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
	return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function sealSession(secret: string, session: GithubSession): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await sessionKey(secret);
	const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(session)));
	const out = new Uint8Array(iv.length + data.byteLength);
	out.set(iv);
	out.set(new Uint8Array(data), iv.length);
	return toBase64Url(out);
}

export async function openSession(secret: string, cookieHeader: string | null): Promise<GithubSession | null> {
	const sealed = readCookie(cookieHeader, SESSION_COOKIE);
	if (!sealed) return null;
	try {
		const bytes = fromBase64Url(sealed);
		const key = await sessionKey(secret);
		const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
		const session = JSON.parse(decoder.decode(data)) as GithubSession;
		return session.token && session.login ? session : null;
	} catch {
		return null;
	}
}

export function readCookie(header: string | null, name: string): string | null {
	for (const part of (header ?? '').split(';')) {
		const [key, ...rest] = part.trim().split('=');
		if (key === name) return rest.join('=');
	}
	return null;
}

export function cookie(name: string, value: string, maxAge: number): string {
	return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export const clearCookie = (name: string) => cookie(name, '', 0);
