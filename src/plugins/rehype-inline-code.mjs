const rules = [
	[/^%/, 'qf-node-reference'],
	[/^\$/, 'qf-node-path'],
	[/^@/, 'qf-annotation'],
	[/^[\w.]+\(.*\)$/, 'qf-function'],
	[/^(null|true|false|var|func|const|extends|self)$/, 'qf-keyword'],
	[/^[A-Za-z][A-Za-z ]* [a-z]+$/, 'qf-error'],
];

const textOf = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join(''));

function walk(node, parent) {
	if (node.type === 'element' && node.tagName === 'code' && parent?.tagName !== 'pre') {
		const match = rules.find(([pattern]) => pattern.test(textOf(node)));
		if (match) node.properties.className = [...(node.properties.className ?? []), match[1]];
		return;
	}
	for (const child of node.children ?? []) walk(child, node);
}

export default function rehypeInlineCode() {
	return (tree) => walk(tree);
}
