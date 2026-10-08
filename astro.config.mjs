// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeInlineCode from './src/plugins/rehype-inline-code.mjs';
import './src/styles/palette-css.mjs';

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
			pagination: false,
			head: [
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://queuefree.dev/og.png' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://queuefree.dev/og.png' } },
			],
			// Fonts are declared in src/components/Head.astro.
			customCss: [
				'./src/styles/palette.css',
				'./src/styles/theme.css',
			],
			components: {
				Head: './src/components/Head.astro',
				Hero: './src/components/Hero.astro',
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
				{
					label: 'Scenes',
					items: [{ autogenerate: { directory: 'scenes' } }],
				},
				{
					label: 'Signals',
					items: [{ autogenerate: { directory: 'signals' } }],
				},
				{
					label: 'Saving',
					items: [{ autogenerate: { directory: 'saving' } }],
				},
			],
		}),
	],
});
