import { codeFilename, headingAnchor, type Block, type Page } from './schema.ts';

// Escapes MDX-significant characters in prose while leaving inline code spans
// untouched, so contributors can still write `code` and **bold**.
export function escapeProse(text: string): string {
	return text
		.replace(/\r\n?/g, '\n')
		.trim()
		.split(/(`+[^`]*`+)/)
		.map((part, i) => (i % 2 ? part : part.replace(/[<{]/g, '\\$&')))
		.join('');
}

// For text dropped into a JSX template literal: <SceneTree tree={`...`} />
function templateLiteral(text: string): string {
	return '`' + text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
}

function yamlString(value: string): string {
	return JSON.stringify(value);
}

function fence(code: string, meta: string): string {
	const normalized = code.replace(/\r\n?/g, '\n').replace(/\s+$/, '');
	const longest = Math.max(2, ...[...normalized.matchAll(/`+/g)].map((m) => m[0].length));
	const ticks = '`'.repeat(longest + 1);
	return `${ticks}${meta}\n${normalized}\n${ticks}`;
}

function codeMeta(lang: string, filename: string, wrong = '', right = ''): string {
	const parts = [lang];
	const name = filename.trim().replace(/"/g, '');
	if (name) parts.push(`title="${name}"`);
	if (wrong.trim()) parts.push(`del={${wrong.trim()}}`);
	if (right.trim()) parts.push(`ins={${right.trim()}}`);
	return parts.join(' ');
}

function indentTree(text: string): string {
	const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim());
	const base = Math.min(...lines.map((l) => l.match(/^\s*/)![0].length));
	return lines.map((l) => '  ' + l.slice(base)).join('\n');
}

function renderBlock(block: Block): string {
	switch (block.type) {
		case 'heading':
			return `## ${block.text.trim()}`;
		case 'prose':
			return escapeProse(block.text);
		case 'code':
			{
				const filled = (['gdscript', 'csharp'] as const).filter((l) => block[l].code.trim());
				const snippet = (l: 'gdscript' | 'csharp') => fence(block[l].code, codeMeta(l, codeFilename(block.name, l), block[l].wrong, block[l].right));
				if (filled.length < 2) return snippet(filled[0] ?? 'gdscript');
				const labels = { gdscript: 'GDScript', csharp: 'C#' };
				const tabs = filled.map((l) => `<TabItem label="${labels[l]}">\n\n${snippet(l)}\n\n</TabItem>`);
				return `<Tabs syncKey="lang">\n${tabs.join('\n')}\n</Tabs>`;
			}
		case 'tree':
			return `<SceneTree tree={${templateLiteral('\n' + indentTree(block.text) + '\n')}} />`;
		case 'callout': {
			const title = block.title.trim().replace(/[\[\]]/g, '');
			return `:::${block.kind}[${title}]\n${escapeProse(block.text)}\n:::`;
		}
		case 'error': {
			return `<GodotError message={${templateLiteral(block.message.trim())}} />`;
		}
		case 'steps': {
			const items = block.items.map((item, i) => {
				const body = escapeProse(item).split('\n').join('\n   ');
				return `${i + 1}. ${body}`;
			});
			return `<Steps>\n\n${items.join('\n\n')}\n\n</Steps>`;
		}
		case 'causes': {
			const cell = (text: string) => escapeProse(text).replace(/\n+/g, ' ').replace(/\|/g, '\\|');
			const rows = block.rows.map((r) => {
				const section = r.section.trim();
				return `| ${cell(r.symptom)} | [${cell(section)}](#${headingAnchor(section)}) |`;
			});
			return [`| What's happening | Go to |`, `|---|---|`, ...rows].join('\n');
		}
	}
}

export function pagePath(page: Page): string {
	return `src/content/docs/${page.category}/${page.slug}.mdx`;
}

export function generateMdx(page: Page): string {
	const used = new Set(page.blocks.map((b) => b.type));
	const starlight = ['Aside'];
	if (used.has('steps')) starlight.push('Steps');
	if (page.blocks.some((b) => b.type === 'code' && b.gdscript.code.trim() && b.csharp.code.trim())) starlight.push('Tabs', 'TabItem');

	const imports = [`import { ${starlight.join(', ')} } from '@astrojs/starlight/components';`];
	if (used.has('tree')) imports.push(`import SceneTree from '../../../components/SceneTree.astro';`);
	if (used.has('error')) imports.push(`import GodotError from '../../../components/GodotError.astro';`);

	const frontmatter = [
		'---',
		`title: ${yamlString(page.title.trim())}`,
		`description: ${yamlString(page.description.trim())}`,
		'godot: 4.x',
		'sidebar:',
		`  label: ${yamlString(page.label.trim())}`,
		'---',
	];

	const parts: string[] = [
		frontmatter.join('\n'),
		imports.join('\n'),
		`<Aside type="tip" title="Short answer">\n${escapeProse(page.shortAnswer)}\n</Aside>`,
		...page.blocks.map(renderBlock),
	];

	return parts.join('\n\n') + '\n';
}
