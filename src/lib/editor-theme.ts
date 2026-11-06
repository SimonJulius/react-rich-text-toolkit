import type { EditorThemeClasses } from 'lexical'

export const editorTheme: EditorThemeClasses = {
    text: {
        underline: 'rte-underline',
        strikethrough: 'rte-strike',
        underlineStrikethrough: 'rte-underline-strike',
    },
    code: 'rte-code-block',
    codeHighlight: {
        comment: 'rte-token-comment',
        keyword: 'rte-token-keyword',
        operator: 'rte-token-keyword',
        string: 'rte-token-string',
        char: 'rte-token-string',
        number: 'rte-token-number',
        boolean: 'rte-token-number',
        function: 'rte-token-function',
        'class-name': 'rte-token-function',
        builtin: 'rte-token-function',
        tag: 'rte-token-keyword',
        property: 'rte-token-property',
        key: 'rte-token-property',
        'attr-name': 'rte-token-property',
        'attr-value': 'rte-token-string',
        selector: 'rte-token-function',
        punctuation: 'rte-token-punctuation',
        deleted: 'rte-token-deleted',
        inserted: 'rte-token-inserted',
    },
    list: {
        checklist: 'rte-checklist',
        listitemChecked: 'rte-checked',
        listitemUnchecked: 'rte-unchecked',
    },
    tableCellSelected: 'rte-cell-selected',
    tableSelection: 'rte-table-selection',
}
