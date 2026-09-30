// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://queuefree.dev',
	integrations: [
		starlight({
			title: 'Queue Free',
			description: 'Short, practical answers to the most asked Godot 4 questions.',
			lastUpdated: true,
			sidebar: [
				{
					label: 'Movement',
					items: [{ autogenerate: { directory: 'movement' } }],
				},
			],
		}),
	],
});
