const scope = (scope, foreground) => ({ scope, settings: { foreground } });

export const godotTheme = (name, type, { code, frame }) => ({
	name,
	type,
	colors: {
		'editor.background': frame.code,
		'editor.foreground': code.default,
		'editorLineNumber.foreground': code.dim,
		'editorLineNumber.activeForeground': code.dim,
		'editorGroupHeader.tabsBackground': frame.error,
		'tab.activeBackground': frame.code,
		'tab.activeForeground': code.default,
		'tab.inactiveBackground': frame.error,
	},
	tokenColors: [
		scope(['source', 'variable'], code.default),
		scope(['punctuation', 'keyword.operator', 'meta.brace'], code.symbol),
		scope(['keyword', 'storage', 'keyword.operator.wordlike', 'keyword.operator.boolean', 'constant.language'], code.keyword),
		scope(['keyword.control'], code.controlFlow),
		scope(['entity.name.type.class.builtin', 'keyword.type', 'storage.type.primitive'], code.baseType),
		scope(['entity.name.type', 'support.class', 'entity.other.inherited-class'], code.engineType),
		scope(['comment', 'punctuation.definition.comment'], code.dim),
		scope(['string', 'constant.character.escape'], code.string),
		scope(['constant.numeric'], code.number),
		scope(['entity.name.function', 'entity.name.function.other', 'support.function'], code.function),
		scope(['variable.other.property', 'variable.other.member'], code.member),
		scope(['entity.name.function.decorator', 'punctuation.definition.decorator'], code.annotation),
		scope(
			['meta.literal.nodepath', 'meta.literal.nodepath keyword.control.flow', 'meta.literal.nodepath constant.character.escape'],
			code.path,
		),
		scope(['meta.function.gdscript meta.literal.nodepath constant.character.escape'], code.string),
	],
});
