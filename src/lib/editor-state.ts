import { $generateHtmlFromNodes } from '@lexical/html'
import { $getRoot } from 'lexical'
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical'

export const EXTERNAL_VALUE = 'rich-text-editor:external-value'

export interface RichTextSnapshot {
    html: string
    text: string
    json: SerializedEditorState
    isEmpty: boolean
}

export interface RichTextChangeEvent extends RichTextSnapshot {
    editorState: EditorState
    tags: ReadonlySet<string>
}

export function readSnapshot(editor: LexicalEditor, state = editor.getEditorState()): RichTextSnapshot {
    return state.read(() => {
        const root = $getRoot()
        const text = root.getTextContent()
        const first = root.getFirstChild()
        const isEmpty = root.isEmpty() || (root.getChildrenSize() === 1 && first?.getType() === 'paragraph' && first.getTextContentSize() === 0)
        return { html: isEmpty ? '' : $generateHtmlFromNodes(editor), text, json: state.toJSON(), isEmpty }
    })
}

