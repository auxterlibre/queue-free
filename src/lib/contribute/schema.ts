// Shared between the contribute form (browser) and the Pages Function that
// turns a submission into a pull request. Keep it free of DOM and Node APIs.

import { SCENE_TREE_LINE } from '../scene-tree.ts';

export type Categories = Record<string, string>;
export type PageKind = 'how-to' | 'error';
export type CodeLang = 'gdscript' | 'csharp' | 'txt';
export type CodeTab = 'gdscript' | 'csharp';
export const CODE_EXT: Record<CodeTab, string> = { gdscript: '.gd', csharp: '.cs' };
export type CalloutKind = 'note' | 'tip' | 'caution';

export interface CodeSnippet {
	code: string;
	wrong: string;
	right: string;
}

export function codeFilename(name: string, lang: CodeTab): string {
	const stem = name.trim();
	return stem ? stem + CODE_EXT[lang] : '';
}

export interface CauseRow {
	symptom: string;
	section: string;
}

export type Block =
	| { type: 'heading'; text: string }
	| { type: 'prose'; text: string }
	| { type: 'code'; lang: CodeTab; name: string; gdscript: CodeSnippet; csharp: CodeSnippet }
	| { type: 'tree'; text: string }
	| { type: 'callout'; kind: CalloutKind; title: string; text: string }
	| { type: 'error'; message: string }
	| { type: 'steps'; items: string[] }
	| { type: 'causes'; rows: CauseRow[] };

export type BlockType = Block['type'];

export interface Page {
	kind: PageKind;
	category: string;
	categoryLabel: string;
	title: string;
	description: string;
	label: string;
	slug: string;
	shortAnswer: string;
	blocks: Block[];
}

export interface Submission {
	page: Page;
	contributor: string;
	notes: string;
	turnstileToken: string;
}

export interface Issue {
	path: string;
	message: string;
}

export const LIMITS = {
	blocks: 40,
	steps: 12,
	causes: 8,
	title: 120,
	description: 200,
	label: 40,
	shortAnswer: 400,
	text: 4000,
	code: 6000,
	tree: 2000,
	bodyBytes: 64 * 1024,
};

const LINE_SPEC = /^\d+(-\d+)?(,\d+(-\d+)?)*$/;
const ESM_LINE = /^(import|export)\s/m;

const QUESTION_PREFIX = /^(how (do|can|should) i|how to|why (does|do|did) (it say|i get|it)|why (does|do|did)|why am i getting|why|what (is|does)|where (is|do i))\s+/i;
const FILLER_WORDS = /\b(a|an|the|my|it|its)\b/g;

// "How do I connect a signal in code?" -> "Connect a signal in code"
export function labelFromTitle(title: string): string {
	const text = title.trim().replace(QUESTION_PREFIX, '').replace(/[?.!]+$/, '').replace(/^["“]|["”]$/g, '').trim();
	return text ? text[0]!.toUpperCase() + text.slice(1) : '';
}

// "Connect a signal in code" -> "connect-signal-in-code"
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[’']/g, '')
		.replace(FILLER_WORDS, ' ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Same rule rehype-slug (github-slugger) applies to the built page, so a
// link made here lands on the heading. Inline markup is dropped first,
// as the slugger only sees the heading's text.
export function headingAnchor(text: string): string {
	return text
		.trim()
		.replace(/[`*]/g, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
		.replace(/ /g, '-');
}

export function headingTexts(blocks: unknown): string[] {
	if (!Array.isArray(blocks)) return [];
	return blocks
		.filter((b) => b && typeof b === 'object' && b.type === 'heading' && typeof b.text === 'string')
		.map((b) => b.text.trim())
		.filter(Boolean);
}

export function isNewCategory(page: { category: string }, known: Categories): boolean {
	return !(page.category in known);
}

function checkText(issues: Issue[], path: string, value: unknown, max: number, required = true): value is string {
	if (typeof value !== 'string') {
		issues.push({ path, message: 'Missing.' });
		return false;
	}
	if (required && !value.trim()) {
		issues.push({ path, message: 'This is required.' });
		return false;
	}
	if (value.length > max) {
		issues.push({ path, message: `Too long (max ${max} characters).` });
		return false;
	}
	return true;
}

function checkProse(issues: Issue[], path: string, value: unknown, max: number, required = true) {
	if (!checkText(issues, path, value, max, required)) return;
	if (ESM_LINE.test(value)) {
		issues.push({ path, message: 'A line cannot start with the word "import" or "export". Reword it.' });
	}
}

function checkTree(issues: Issue[], path: string, value: unknown) {
	if (!checkText(issues, path, value, LIMITS.tree)) return;
	const lines = value.split('\n').filter((l) => l.trim());
	if (!lines.length) {
		issues.push({ path, message: 'Add at least one node.' });
		return;
	}
	for (const line of lines) {
		if (!SCENE_TREE_LINE.test(line)) {
			issues.push({ path, message: `Can't read the line "${line.trim()}". Use "Name: Type".` });
			return;
		}
	}
}

function checkLineSpec(issues: Issue[], path: string, value: unknown) {
	if (typeof value !== 'string') {
		issues.push({ path, message: 'Missing.' });
		return;
	}
	if (value.trim() && !LINE_SPEC.test(value.trim())) {
		issues.push({ path, message: 'Use line numbers like "2" or "1-3,5".' });
	}
}

function checkBlock(issues: Issue[], path: string, value: unknown, headings: string[]) {
	if (!value || typeof value !== 'object') {
		issues.push({ path, message: 'Missing.' });
		return;
	}
	const b = value as Record<string, unknown>;
	switch (b.type) {
		case 'heading':
			checkText(issues, `${path}.text`, b.text, LIMITS.title);
			break;
		case 'prose':
			checkProse(issues, `${path}.text`, b.text, LIMITS.text);
			break;
		case 'code':
			if (!['gdscript', 'csharp'].includes(b.lang as string)) {
				issues.push({ path: `${path}.lang`, message: 'Pick a language.' });
			}
			checkText(issues, `${path}.name`, b.name, 80, false);
			for (const lang of ['gdscript', 'csharp'] as const) {
				const snippet = b[lang] as Record<string, unknown> | undefined;
				if (!snippet || typeof snippet !== 'object') {
					issues.push({ path: `${path}.${lang}`, message: 'Missing.' });
					continue;
				}
				checkText(issues, `${path}.${lang}.code`, snippet.code, LIMITS.code, false);
				checkLineSpec(issues, `${path}.${lang}.wrong`, snippet.wrong);
				checkLineSpec(issues, `${path}.${lang}.right`, snippet.right);
			}
			if (!String((b.gdscript as any)?.code ?? '').trim() && !String((b.csharp as any)?.code ?? '').trim()) {
				issues.push({ path: `${path}.${b.lang === 'csharp' ? 'csharp' : 'gdscript'}.code`, message: 'Add some code.' });
			}
			break;
		case 'tree':
			checkTree(issues, `${path}.text`, b.text);
			break;
		case 'callout':
			if (!['note', 'tip', 'caution'].includes(b.kind as string)) {
				issues.push({ path: `${path}.kind`, message: 'Pick a callout type.' });
			}
			checkText(issues, `${path}.title`, b.title, LIMITS.title);
			checkProse(issues, `${path}.text`, b.text, LIMITS.text);
			break;
		case 'error':
			checkText(issues, `${path}.message`, b.message, LIMITS.text);
			break;
		case 'steps': {
			if (!Array.isArray(b.items) || !b.items.length) {
				issues.push({ path: `${path}.items`, message: 'Add at least one step.' });
				break;
			}
			if (b.items.length > LIMITS.steps) {
				issues.push({ path: `${path}.items`, message: `Too many steps (max ${LIMITS.steps}).` });
				break;
			}
			b.items.forEach((item, i) => checkProse(issues, `${path}.items.${i}`, item, LIMITS.text));
			break;
		}
		case 'causes': {
			if (!Array.isArray(b.rows) || !b.rows.length) {
				issues.push({ path: `${path}.rows`, message: 'Add at least one row.' });
				break;
			}
			if (b.rows.length > LIMITS.causes) {
				issues.push({ path: `${path}.rows`, message: `Too many rows (max ${LIMITS.causes}).` });
				break;
			}
			b.rows.forEach((row, i) => {
				const rowPath = `${path}.rows.${i}`;
				if (!row || typeof row !== 'object') {
					issues.push({ path: rowPath, message: 'Missing.' });
					return;
				}
				const r = row as Record<string, unknown>;
				checkProse(issues, `${rowPath}.symptom`, r.symptom, LIMITS.description);
				if (typeof r.section !== 'string' || !headings.includes(r.section.trim())) {
					issues.push({ path: `${rowPath}.section`, message: 'Pick a section heading from this page.' });
				}
			});
			break;
		}
		default:
			issues.push({ path: `${path}.type`, message: 'Unknown block type.' });
	}
}

export function validatePage(value: unknown, known: Categories): Issue[] {
	const issues: Issue[] = [];
	if (!value || typeof value !== 'object') return [{ path: 'page', message: 'Missing page.' }];
	const p = value as Record<string, unknown>;

	if (p.kind !== 'how-to' && p.kind !== 'error') issues.push({ path: 'kind', message: 'Pick a page type.' });
	if (typeof p.category !== 'string' || !KEY.test(p.category)) {
		issues.push({ path: 'category', message: 'Use lowercase words joined by dashes, like "user-interface".' });
	} else if (!(p.category in known)) {
		checkText(issues, 'categoryLabel', p.categoryLabel, LIMITS.label);
	}
	checkText(issues, 'title', p.title, LIMITS.title);
	checkText(issues, 'description', p.description, LIMITS.description);
	checkText(issues, 'label', p.label, LIMITS.label);
	checkProse(issues, 'shortAnswer', p.shortAnswer, LIMITS.shortAnswer);

	if (typeof p.slug !== 'string' || !KEY.test(p.slug)) {
		issues.push({ path: 'slug', message: 'Use lowercase words joined by dashes, like "connect-signal-in-code".' });
	}

	if (!Array.isArray(p.blocks)) {
		issues.push({ path: 'blocks', message: 'Missing.' });
	} else if (p.blocks.length > LIMITS.blocks) {
		issues.push({ path: 'blocks', message: `Too many blocks (max ${LIMITS.blocks}).` });
	} else {
		const headings = headingTexts(p.blocks);
		p.blocks.forEach((b, i) => checkBlock(issues, `blocks.${i}`, b, headings));
	}

	return issues;
}

export function validateSubmission(value: unknown, known: Categories): Issue[] {
	if (!value || typeof value !== 'object') return [{ path: 'submission', message: 'Missing.' }];
	const s = value as Record<string, unknown>;
	const issues = validatePage(s.page, known).map((i) => ({ ...i, path: `page.${i.path}` }));
	checkText(issues, 'contributor', s.contributor ?? '', 80, false);
	checkText(issues, 'notes', s.notes ?? '', LIMITS.text, false);
	return issues;
}
