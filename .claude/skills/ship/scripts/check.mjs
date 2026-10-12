// Pre-push checks for the site. Run with: node .claude/skills/ship/scripts/check.mjs
// Exits 1 when something must be fixed before pushing.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const docsDir = join(root, 'src/content/docs');
const categories = JSON.parse(readFileSync(join(root, 'src/categories.json'), 'utf8'));
const problems = [];
const warnings = [];

function walk(dir, keep = () => true) {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? walk(path, keep) : keep(path) ? [path] : [];
	});
}

const isPage = (path) => path.endsWith('.mdx') || path.endsWith('.md');

function frontmatter(text) {
	const match = text.match(/^---\n([\s\S]*?)\n---/);
	return match ? match[1] : '';
}

const pages = walk(docsDir, isPage);
const routes = new Set();
for (const page of pages) {
	const rel = relative(docsDir, page).replace(/\.mdx?$/, '');
	routes.add(rel === 'index' ? '/' : `/${rel}/`);
}

// Every category folder has a label, and every label has a folder.
const folders = readdirSync(docsDir).filter((name) => statSync(join(docsDir, name)).isDirectory());
for (const folder of folders) {
	if (!(folder in categories)) problems.push(`src/categories.json has no label for the folder "${folder}"`);
}
for (const key of Object.keys(categories)) {
	if (!folders.includes(key)) problems.push(`src/categories.json lists "${key}" but src/content/docs/${key}/ does not exist`);
}

for (const page of pages) {
	const file = relative(root, page);
	const text = readFileSync(page, 'utf8');
	const fm = frontmatter(text);
	const inCategory = relative(docsDir, page).includes('/');

	if (!fm) {
		problems.push(`${file}: missing frontmatter`);
		continue;
	}
	if (inCategory) {
		for (const field of ['title:', 'description:', 'godot:', 'label:']) {
			if (!fm.includes(field)) problems.push(`${file}: frontmatter is missing "${field.slice(0, -1)}"`);
		}
		if (/title: (How do I|Why does) \.\.\./.test(fm)) problems.push(`${file}: title is still the template placeholder`);
		if (/label: Short sidebar name/.test(fm)) problems.push(`${file}: sidebar label is still the template placeholder`);
		if (!/<Aside type="tip" title="Short answer">/.test(text)) problems.push(`${file}: no "Short answer" aside`);
		if (/href="\/category\/page\/"/.test(text)) problems.push(`${file}: Related still links to the template placeholder /category/page/`);
		const hasGdscript = /```gdscript/.test(text);
		const hasCsharp = /```csharp/.test(text);
		const usesTabs = /<Tabs/.test(text);
		if (usesTabs && hasGdscript && !hasCsharp) warnings.push(`${file}: has a GDScript tab but no C# tab`);
	}

	// Internal links must point at a page that exists.
	for (const match of text.matchAll(/href="(\/[^"#?]*)"/g)) {
		const href = match[1];
		if (href.startsWith('/api/') || href === '/write/' || href === '/support/') continue;
		if (!routes.has(href)) {
			const trailing = href.endsWith('/') ? href : `${href}/`;
			if (!routes.has(trailing)) problems.push(`${file}: link to ${href} does not match any page`);
			else problems.push(`${file}: link to ${href} is missing its trailing slash`);
		}
	}

	// GDScript blocks should follow GDScript naming: no camelCase identifiers.
	for (const block of text.matchAll(/```gdscript[^\n]*\n([\s\S]*?)```/g)) {
		const camel = block[1].match(/\b(?:var|func|signal|const)\s+([a-z]+[A-Z]\w*)/g);
		if (camel) warnings.push(`${file}: camelCase in a GDScript block: ${camel.join(', ')}`);
	}

	// Screenshots must be .webp under src/assets/<category>/.
	for (const image of text.matchAll(/import\s+\w+\s+from\s+'([^']+\.(png|jpe?g|gif|webp))'/g)) {
		if (!image[1].endsWith('.webp')) problems.push(`${file}: image ${image[1]} should be a .webp`);
		if (!image[1].includes('/assets/')) warnings.push(`${file}: image ${image[1]} is not under src/assets/`);
	}
}

// Images in src/assets must be webp.
const assetsDir = join(root, 'src/assets');
if (existsSync(assetsDir)) {
	for (const asset of walk(assetsDir)) {
		if (/\.(png|jpe?g|gif)$/i.test(asset)) problems.push(`${relative(root, asset)}: screenshots must be .webp`);
	}
}

for (const line of warnings) console.log(`warning: ${line}`);
for (const line of problems) console.log(`error: ${line}`);
if (problems.length === 0) console.log(`checked ${pages.length} pages, ${folders.length} categories: ok`);
process.exit(problems.length ? 1 : 0);
