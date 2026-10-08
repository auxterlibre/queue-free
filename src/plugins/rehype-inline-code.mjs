import { readdirSync } from 'node:fs';
import { createHighlighter } from 'shiki';
import { dark, light } from '../styles/palette.mjs';
import { godotTheme } from '../styles/code-theme.mjs';

const errorPhrase = /^[A-Za-z][A-Za-z ]* [a-z]+$/;
const pathOrFile = (text) => !/[$%("']/.test(text) && (/\//.test(text) || /\.(gd|tscn|cs|json|txt)$/.test(text));
const godotClasses = new Set(
	readdirSync(new URL('../../public/godot-editor-icons/', import.meta.url)).map((f) => f.replace(/\.svg$/, '')),
);
const nodeName = (text) => /^[A-Z]\w*$/.test(text) && !godotClasses.has(text);

const highlighter = createHighlighter({
	themes: [godotTheme('godot-4-modern', 'dark', dark), godotTheme('godot-4-light', 'light', light)],
	langs: ['gdscript'],
});

const textOf = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join(''));

const highlight = (shiki, node) => {
	const text = textOf(node);
	if (errorPhrase.test(text)) {
		node.properties.className = [...(node.properties.className ?? []), 'qf-error'];
		return;
	}
	if (pathOrFile(text) || nodeName(text)) return;
	const root = shiki.codeToHast(text, {
		lang: 'gdscript',
		themes: { dark: 'godot-4-modern', light: 'godot-4-light' },
		defaultColor: false,
		structure: 'inline',
	});
	node.children = root.children;
	node.properties.className = [...(node.properties.className ?? []), 'qf-inline'];
};

const walk = (shiki, node, parent) => {
	if (node.type === 'element' && node.tagName === 'code' && parent?.tagName !== 'pre') {
		highlight(shiki, node);
		return;
	}
	for (const child of node.children ?? []) walk(shiki, child, node);
};

export default function rehypeInlineCode() {
	return async (tree) => walk(await highlighter, tree);
}
