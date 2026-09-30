import { writeFileSync } from 'node:fs';
import { code, frame } from './palette.mjs';

const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

const vars = [
	...Object.entries(code).map(([k, v]) => `--qf-code-${kebab(k)}: ${v};`),
	...Object.entries(frame).map(([k, v]) => `--qf-frame-${kebab(k)}: ${v};`),
];

writeFileSync(
	new URL('./palette.css', import.meta.url),
	`/* Generated from palette.mjs by palette-css.mjs. Do not edit. */\n:root {\n\t${vars.join('\n\t')}\n}\n`,
);
