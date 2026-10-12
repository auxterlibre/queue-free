// Line markup shared by the plain fallback and the Shiki-powered highlighter.
export interface LineOptions {
	numbers?: boolean;
	del?: Set<number>;
	ins?: Set<number>;
}

export const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function wrapLine(inner: string, n: number, opts: LineOptions): string {
	const cls = opts.del?.has(n) ? ' del' : opts.ins?.has(n) ? ' ins' : '';
	const number = opts.numbers ? `<span class="n">${n}</span>` : '';
	return `<span class="ln${cls}">${number}<span class="t">${inner || ' '}</span></span>`;
}

// Used before the highlighter has loaded, and for plain text.
export function plainLines(code: string, opts: LineOptions = {}): string {
	return code.split('\n').map((line, i) => wrapLine(escapeHtml(line), i + 1, opts)).join('');
}
