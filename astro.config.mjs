// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeInlineCode from './src/plugins/rehype-inline-code.mjs';

export default defineConfig({
	site: 'https://queuefree.dev',
	markdown: {
		rehypePlugins: [rehypeInlineCode],
	},
	integrations: [
		starlight({
			title: 'Queue Free',
			description: 'Short, practical answers to the most asked Godot 4 questions.',
			lastUpdated: true,
			// Fonts are declared in src/components/Head.astro.
			customCss: [
				'./src/styles/palette.css',
				'./src/styles/theme.css',
			],
			components: {
				Head: './src/components/Head.astro',
				Header: './src/components/Header.astro',
				SiteTitle: './src/components/SiteTitle.astro',
				Sidebar: './src/components/Sidebar.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
				PageTitle: './src/components/PageTitle.astro',
			},
			sidebar: [
				{
					label: 'Common errors',
					items: [{ autogenerate: { directory: 'errors' } }],
				},
				{
					label: 'Movement',
					items: [{ autogenerate: { directory: 'movement' } }],
				},
			],
		}),
	],
});
