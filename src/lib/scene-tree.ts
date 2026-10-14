export interface SceneNode {
	name: string;
	type: string;
	script: boolean;
	unique: boolean;
	note: string;
	children: SceneNode[];
}

export const SCENE_TREE_LINE = /^(\s*)([^:"\[]+?)\s*(?::\s*(\w+))?\s*((?:\[\w+\]\s*)*)(?:"(.*)")?\s*$/;

export function parseSceneTreeStrict(text: string): SceneNode[] {
	const lines = text.split('\n').filter((l) => l.trim());
	if (!lines.length) return [];
	const base = Math.min(...lines.map((l) => l.match(/^\s*/)![0].length));
	const roots: SceneNode[] = [];
	const stack: { depth: number; node: SceneNode }[] = [];
	for (const line of lines) {
		const m = line.match(SCENE_TREE_LINE);
		if (!m) throw new Error(`SceneTree: can't read line "${line}"`);
		const depth = (m[1]!.length - base) / 2;
		const node: SceneNode = {
			name: m[2]!,
			type: m[3] ?? 'Node',
			script: m[4]!.includes('[script]'),
			unique: m[4]!.includes('[unique]'),
			note: m[5] ?? '',
			children: [],
		};
		while (stack.length && stack[stack.length - 1]!.depth >= depth) stack.pop();
		(stack.length ? stack[stack.length - 1]!.node.children : roots).push(node);
		stack.push({ depth, node });
	}
	return roots;
}

export function parseSceneTree(text: string): SceneNode[] | null {
	try {
		return parseSceneTreeStrict(text);
	} catch {
		return null;
	}
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const icon = (name: string) => `/godot-editor-icons/${esc(name)}.svg`;

function items(nodes: SceneNode[]): string {
	return nodes
		.map(
			(n) =>
				`<li role="treeitem"><span class="row">` +
				`<img src="${icon(n.type)}" alt="" width="16" height="16" onerror="this.style.visibility='hidden'">` +
				`<span class="name">${esc(n.name)}</span><span class="type">${esc(n.type)}</span>` +
				(n.unique ? `<img class="flag" src="${icon('SceneUniqueName')}" alt="unique name" title="Access as Unique Name (%)" width="16" height="16">` : '') +
				(n.script ? `<img class="script" src="${icon('Script')}" alt="has script" title="Has a script" width="16" height="16">` : '') +
				(n.note ? `<span class="note">${esc(n.note)}</span>` : '') +
				`</span>` +
				(n.children.length ? `<ul role="group">${items(n.children)}</ul>` : '') +
				`</li>`,
		)
		.join('');
}

export function renderSceneTree(nodes: SceneNode[]): string {
	return `<ul class="scene-tree" role="tree">${items(nodes)}</ul>`;
}
