// Godot 4 editor defaults: `dark` is the default (dark) theme, `light` is the
// "Light" preset. Keys are shared so every consumer can switch by theme.

export const dark = {
	code: {
		default: '#c9c9c9',
		path: '#63c259',
		string: '#fbe99e',
		function: '#56affa',
		annotation: '#ffb273',
		keyword: '#ff7084',
		baseType: '#41f3b9',
		error: '#ff786b',
		dim: '#6b6b6b',
		symbol: '#abc9ff',
		controlFlow: '#ff8ccc',
		engineType: '#8fffdb',
		number: '#a1ffe0',
		member: '#bce0ff',
	},
	frame: {
		code: '#1a1a1a',
		error: '#1f1f1f',
		tree: '#292929',
		border: '#292929',
		borderWidth: '2px',
		line: '#4a5160',
		muted: '#8a93a3',
		note: '#d8ad38',
		tip: '#41f3b9',
		tipBg: '#1d4135',
	},
};

export const light = {
	code: {
		default: '#393939',
		path: '#528c4a',
		string: '#996b00',
		function: '#0039e6',
		annotation: '#cc8040',
		keyword: '#e62282',
		baseType: '#009933',
		error: '#ff786b',
		dim: '#7d7d7d',
		symbol: '#00009c',
		controlFlow: '#bd1fcc',
		engineType: '#1c8c66',
		number: '#008c47',
		member: '#0066ad',
	},
	frame: {
		code: '#e6e6e6',
		error: '#f0f0f0',
		tree: '#ebebeb',
		border: '#cdcdcd',
		borderWidth: '1px',
		line: '#b4b4b4',
		muted: '#7d7d7d',
		note: '#d8ad38',
		tip: '#187b5a',
		tipBg: 'rgb(24 123 90 / 0.2)',
	},
};
