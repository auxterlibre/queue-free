import { generateMdx, pagePath } from '../../src/lib/contribute/mdx.ts';
import { isNewCategory, LIMITS, validateSubmission, type Categories, type Submission } from '../../src/lib/contribute/schema.ts';

interface KVNamespace {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
	GITHUB_TOKEN: string;
	GITHUB_REPO?: string;
	GITHUB_BASE?: string;
	TURNSTILE_SECRET: string;
	RATE_LIMIT?: KVNamespace;
}

interface Context {
	request: Request;
	env: Env;
}

const SUBMISSIONS_PER_HOUR = 5;
const DEFAULT_REPO = 'auxterlibre/queue-free';
const CATEGORIES_PATH = 'src/categories.json';

const json = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function overRateLimit(kv: KVNamespace | undefined, ip: string): Promise<boolean> {
	if (!kv) return false;
	const key = `propose:${ip}`;
	const count = Number((await kv.get(key)) ?? 0) + 1;
	await kv.put(key, String(count), { expirationTtl: 3600 });
	return count > SUBMISSIONS_PER_HOUR;
}

async function turnstilePassed(secret: string, token: string, ip: string): Promise<boolean> {
	const body = new FormData();
	body.set('secret', secret);
	body.set('response', token);
	body.set('remoteip', ip);
	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
	const data = (await res.json()) as { success?: boolean };
	return data.success === true;
}

function github(env: Env) {
	const repo = env.GITHUB_REPO ?? DEFAULT_REPO;
	const headers = {
		authorization: `Bearer ${env.GITHUB_TOKEN}`,
		accept: 'application/vnd.github+json',
		'user-agent': 'queue-free-contribute',
		'x-github-api-version': '2022-11-28',
	};
	return async <T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> => {
		const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
			method,
			headers: body ? { ...headers, 'content-type': 'application/json' } : headers,
			body: body ? JSON.stringify(body) : undefined,
		});
		const data = (res.status === 204 ? null : await res.json()) as T;
		return { status: res.status, data };
	};
}

function prBody(submission: Submission, path: string, categories: Categories): string {
	const { page, contributor, notes } = submission;
	const newCategory = isNewCategory(page, categories);
	const lines = [
		'Submitted through the contribute form.',
		'',
		`- **Type:** ${page.kind === 'error' ? 'Error page' : 'How-to page'}`,
		`- **Category:** ${newCategory ? `${page.categoryLabel.trim()} (new, folder \`${page.category}\`)` : categories[page.category]}`,
		`- **File:** \`${path}\``,
	];
	if (contributor.trim()) lines.push(`- **Contributor:** ${contributor.trim()}`);
	if (notes.trim()) lines.push('', '### Notes from the contributor', '', notes.trim());
	return lines.join('\n');
}

function toBase64(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary);
}

function fromBase64(text: string): string {
	const binary = atob(text.replace(/\n/g, ''));
	return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
	if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET) {
		return json(503, { error: 'The contribute form is not set up on this deployment yet.' });
	}

	const length = Number(request.headers.get('content-length') ?? 0);
	if (length > LIMITS.bodyBytes) return json(413, { error: 'The page is too large to submit.' });

	let submission: Submission;
	try {
		submission = (await request.json()) as Submission;
	} catch {
		return json(400, { error: 'Could not read the submission.' });
	}

	const api = github(env);
	const base = env.GITHUB_BASE ?? 'main';

	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
	if (!(await turnstilePassed(env.TURNSTILE_SECRET, submission.turnstileToken ?? '', ip))) {
		return json(403, { error: 'The human check did not pass. Reload the page and try again.' });
	}
	if (await overRateLimit(env.RATE_LIMIT, ip)) {
		return json(429, { error: 'Too many submissions from this connection. Try again in an hour.' });
	}

	const categoriesFile = await api<{ content: string; sha: string }>('GET', `/contents/${CATEGORIES_PATH}?ref=${base}`);
	if (categoriesFile.status !== 200) return json(502, { error: 'Could not read the repository.' });
	const categories = JSON.parse(fromBase64(categoriesFile.data.content)) as Categories;

	const issues = validateSubmission(submission, categories);
	if (issues.length) return json(422, { error: 'Some fields need attention.', issues });

	const { page } = submission;
	const path = pagePath(page);
	const newCategory = isNewCategory(page, categories);

	const existing = await api('GET', `/contents/${path}?ref=${base}`);
	if (existing.status === 200) {
		return json(409, { error: 'A page with this address already exists. Change the address.', issues: [{ path: 'page.slug', message: 'Already taken.' }] });
	}

	const ref = await api<{ object: { sha: string } }>('GET', `/git/ref/heads/${base}`);
	if (ref.status !== 200) return json(502, { error: 'Could not read the repository.' });

	const branch = `contribute/${page.slug}-${crypto.randomUUID().slice(0, 6)}`;
	const created = await api('POST', '/git/refs', { ref: `refs/heads/${branch}`, sha: ref.data.object.sha });
	if (created.status !== 201) return json(502, { error: 'Could not create a branch for the page.' });

	if (newCategory) {
		const updated = { ...categories, [page.category]: page.categoryLabel.trim() };
		const commit = await api('PUT', `/contents/${CATEGORIES_PATH}`, {
			message: `Add the ${page.categoryLabel.trim()} category`,
			content: toBase64(JSON.stringify(updated, null, '\t') + '\n'),
			sha: categoriesFile.data.sha,
			branch,
		});
		if (commit.status !== 200) return json(502, { error: 'Could not add the category.' });
	}

	const commit = await api('PUT', `/contents/${path}`, {
		message: `Add ${page.category}/${page.slug} from the contribute form`,
		content: toBase64(generateMdx(page)),
		branch,
	});
	if (commit.status !== 201) return json(502, { error: 'Could not commit the page.' });

	const pr = await api<{ html_url: string; number: number }>('POST', '/pulls', {
		title: page.title.trim(),
		head: branch,
		base,
		body: prBody(submission, path, categories),
	});
	if (pr.status !== 201) return json(502, { error: 'Could not open the pull request.' });

	await api('POST', `/issues/${pr.data.number}/labels`, { labels: ['contribution'] }).catch(() => {});

	return json(201, { url: pr.data.html_url, number: pr.data.number });
}
