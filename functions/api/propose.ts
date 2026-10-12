import { generateMdx, pagePath } from '../../src/lib/contribute/mdx.ts';
import { isNewCategory, LIMITS, validateSubmission, type Categories, type Page, type Submission } from '../../src/lib/contribute/schema.ts';
import { openSession, type GithubSession } from '../../src/lib/contribute/session.ts';

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
	SESSION_SECRET?: string;
}

interface Context {
	request: Request;
	env: Env;
}

type Api = <T = unknown>(method: string, path: string, body?: unknown) => Promise<{ status: number; data: T }>;

const SUBMISSIONS_PER_HOUR = 5;
const DEFAULT_REPO = 'auxterlibre/queue-free';
const CATEGORIES_PATH = 'src/categories.json';

class ProposeError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

const json = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function overRateLimit(kv: KVNamespace | undefined, ip: string): Promise<boolean> {
	if (!kv) return false;
	const key = `propose:${ip}`;
	const count = Number((await kv.get(key)) ?? 0) + 1;
	await kv.put(key, String(count), { expirationTtl: 3600 });
	return count > SUBMISSIONS_PER_HOUR;
}

async function turnstilePassed(secret: string, token: string, ip: string): Promise<boolean> {
	if (!token) return false;
	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ secret, response: token, remoteip: ip, idempotency_key: crypto.randomUUID() }),
	});
	const data = (await res.json()) as { success?: boolean; action?: string };
	// The widget is rendered with action "propose"; a token minted elsewhere is refused.
	return data.success === true && (data.action ?? 'propose') === 'propose';
}

function githubApi(token: string): Api {
	const headers = {
		authorization: `Bearer ${token}`,
		accept: 'application/vnd.github+json',
		'user-agent': 'queue-free-contribute',
		'x-github-api-version': '2022-11-28',
	};
	return async (method, path, body) => {
		const res = await fetch(`https://api.github.com${path}`, {
			method,
			headers: body ? { ...headers, 'content-type': 'application/json' } : headers,
			body: body ? JSON.stringify(body) : undefined,
		});
		const data = res.status === 204 ? null : await res.json().catch(() => null);
		return { status: res.status, data };
	};
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

function prBody(submission: Submission, path: string, categories: Categories, login?: string): string {
	const { page, contributor, notes } = submission;
	const newCategory = isNewCategory(page, categories);
	const lines = [
		login ? `Submitted through the contribute form by @${login}.` : 'Submitted through the contribute form.',
		'',
		`- **Type:** ${page.kind === 'error' ? 'Error page' : 'How-to page'}`,
		`- **Category:** ${newCategory ? `${page.categoryLabel.trim()} (new, folder \`${page.category}\`)` : categories[page.category]}`,
		`- **File:** \`${path}\``,
	];
	if (contributor.trim() && contributor.trim() !== login) lines.push(`- **Contributor:** ${contributor.trim()}`);
	if (notes.trim()) lines.push('', '### Notes from the contributor', '', notes.trim());
	return lines.join('\n');
}

// Writes the page (and the category list when it is new) to a branch of
// `repo`, which is the site itself or the contributor's fork of it.
async function commitPage(api: Api, repo: string, branch: string, baseSha: string, page: Page, categories: Categories) {
	const created = await api('POST', `/repos/${repo}/git/refs`, { ref: `refs/heads/${branch}`, sha: baseSha });
	if (created.status !== 201) throw new ProposeError(502, 'Could not create a branch for the page.');

	if (isNewCategory(page, categories)) {
		const current = await api<{ sha: string }>('GET', `/repos/${repo}/contents/${CATEGORIES_PATH}?ref=${branch}`);
		const updated = { ...categories, [page.category]: page.categoryLabel.trim() };
		const commit = await api('PUT', `/repos/${repo}/contents/${CATEGORIES_PATH}`, {
			message: `Add the ${page.categoryLabel.trim()} category`,
			content: toBase64(JSON.stringify(updated, null, '\t') + '\n'),
			sha: current.data?.sha,
			branch,
		});
		if (commit.status !== 200) throw new ProposeError(502, 'Could not add the category.');
	}

	const commit = await api('PUT', `/repos/${repo}/contents/${pagePath(page)}`, {
		message: `Add ${page.category}/${page.slug} from the contribute form`,
		content: toBase64(generateMdx(page)),
		branch,
	});
	if (commit.status !== 201) throw new ProposeError(502, 'Could not commit the page.');
}

// Forks the site under the contributor's account, or finds their existing
// fork, and brings its base branch up to date.
async function readyFork(user: Api, repo: string, base: string): Promise<{ fork: string; sha: string }> {
	const forked = await user<{ full_name: string }>('POST', `/repos/${repo}/forks`, { default_branch_only: true });
	if (forked.status !== 202 || !forked.data?.full_name) throw new ProposeError(502, 'Could not fork the site to your GitHub account.');
	const fork = forked.data.full_name;

	for (let attempt = 0; attempt < 8; attempt++) {
		if ((await user('GET', `/repos/${fork}/git/ref/heads/${base}`)).status === 200) break;
		await sleep(1000);
	}
	await user('POST', `/repos/${fork}/merge-upstream`, { branch: base });

	const ref = await user<{ object: { sha: string } }>('GET', `/repos/${fork}/git/ref/heads/${base}`);
	if (ref.status !== 200 || !ref.data?.object?.sha) throw new ProposeError(502, 'Your fork is not ready yet. Try again in a moment.');
	return { fork, sha: ref.data.object.sha };
}

async function openPullRequest(api: Api, repo: string, head: string, base: string, submission: Submission, categories: Categories, login?: string) {
	const pr = await api<{ html_url: string; number: number }>('POST', `/repos/${repo}/pulls`, {
		title: submission.page.title.trim(),
		head,
		base,
		body: prBody(submission, pagePath(submission.page), categories, login),
		maintainer_can_modify: true,
	});
	if (pr.status !== 201 || !pr.data) throw new ProposeError(502, 'Could not open the pull request.');
	return pr.data;
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

	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
	if (!(await turnstilePassed(env.TURNSTILE_SECRET, submission.turnstileToken ?? '', ip))) {
		return json(403, { error: 'The human check did not pass. Reload the page and try again.' });
	}
	if (await overRateLimit(env.RATE_LIMIT, ip)) {
		return json(429, { error: 'Too many submissions from this connection. Try again in an hour.' });
	}

	const owner = githubApi(env.GITHUB_TOKEN);
	const repo = env.GITHUB_REPO ?? DEFAULT_REPO;
	const base = env.GITHUB_BASE ?? 'main';

	const categoriesFile = await owner<{ content: string }>('GET', `/repos/${repo}/contents/${CATEGORIES_PATH}?ref=${base}`);
	if (categoriesFile.status !== 200 || !categoriesFile.data) return json(502, { error: 'Could not read the repository.' });
	const categories = JSON.parse(fromBase64(categoriesFile.data.content)) as Categories;

	const issues = validateSubmission(submission, categories);
	if (issues.length) return json(422, { error: 'Some fields need attention.', issues });

	const { page } = submission;
	const existing = await owner('GET', `/repos/${repo}/contents/${pagePath(page)}?ref=${base}`);
	if (existing.status === 200) {
		return json(409, { error: 'A page with this address already exists. Change the address.', issues: [{ path: 'page.slug', message: 'Already taken.' }] });
	}

	const session: GithubSession | null = env.SESSION_SECRET ? await openSession(env.SESSION_SECRET, request.headers.get('cookie')) : null;
	const branch = `contribute/${page.slug}-${crypto.randomUUID().slice(0, 6)}`;

	try {
		let pr: { html_url: string; number: number };
		if (session) {
			// Signed in: the fork, the commit, and the pull request are all the contributor's.
			const user = githubApi(session.token);
			const { fork, sha } = await readyFork(user, repo, base);
			await commitPage(user, fork, branch, sha, page, categories);
			pr = await openPullRequest(user, repo, `${fork.split('/')[0]}:${branch}`, base, submission, categories, session.login);
		} else {
			const ref = await owner<{ object: { sha: string } }>('GET', `/repos/${repo}/git/ref/heads/${base}`);
			if (ref.status !== 200 || !ref.data) throw new ProposeError(502, 'Could not read the repository.');
			await commitPage(owner, repo, branch, ref.data.object.sha, page, categories);
			pr = await openPullRequest(owner, repo, branch, base, submission, categories);
		}
		await owner('POST', `/repos/${repo}/issues/${pr.number}/labels`, { labels: ['contribution'] }).catch(() => {});
		return json(201, { url: pr.html_url, number: pr.number, author: session?.login ?? null });
	} catch (error) {
		if (error instanceof ProposeError) return json(error.status, { error: error.message });
		return json(502, { error: 'GitHub did not accept the page. Try again in a moment.' });
	}
}
