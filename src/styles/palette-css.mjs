import { writeFileSync } from 'node:fs';
import { dark, light } from './palette.mjs';

const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

const vars = ({ code, frame }) => [
	...Object.entries(code).map(([k, v]) => `--qf-code-${kebab(k)}: ${v};`),
	...Object.entries(frame).map(([k, v]) => `--qf-frame-${kebab(k)}: ${v};`),
];

const block = (selector, palette) => `${selector} {\n\t${vars(palette).join('\n\t')}\n}\n`;

writeFileSync(
	new URL('./palette.css', import.meta.url),
	`/* Generated from palette.mjs by palette-css.mjs. Do not edit. */\n` +
		block(`:root,\n:root[data-theme='dark']`, dark) +
		`\n` +
		block(`:root[data-theme='light']`, light),
);
