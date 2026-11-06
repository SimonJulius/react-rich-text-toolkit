import { useLayoutEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $generateNodesFromDOM } from '@lexical/html'
import { $createParagraphNode, $getRoot, $insertNodes, $setSelection, CLEAR_HISTORY_COMMAND } from 'lexical'
import { parseEditorHtml } from '../lib/editor-html'
import { EXTERNAL_VALUE, readSnapshot } from '../lib/editor-state'
import type { RichTextChangeEvent } from '../lib/editor-state'

interface Props {
    value?: string
    onChange?: (html: string, event: RichTextChangeEvent) => void
}

export default function CustomOnChangePlugin({ value, onChange }: Props) {
    const [editor] = useLexicalComposerContext()
    const lastEmitted = useRef<string>()
    const callback = useRef(onChange)

    useLayoutEffect(() => {
        callback.current = onChange
    }, [onChange])

    useLayoutEffect(() => editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
        if (tags.has(EXTERNAL_VALUE) || (!dirtyElements.size && !dirtyLeaves.size) || !callback.current) return
        const snapshot = readSnapshot(editor, editorState)
        lastEmitted.current = snapshot.html
        callback.current(snapshot.html, { ...snapshot, editorState, tags })
    }), [editor])

    useLayoutEffect(() => {
        if (value === undefined || value === lastEmitted.current) return
        lastEmitted.current = undefined
        if (readSnapshot(editor).html === value) return
        editor.update(() => {
            const root = $getRoot()
            const nodes = $generateNodesFromDOM(editor, parseEditorHtml(value))
            root.clear()
            root.select()
            if (nodes.length) $insertNodes(nodes)
            if (root.isEmpty()) root.append($createParagraphNode())
            $setSelection(null)
        }, {
            discrete: true,
            tag: EXTERNAL_VALUE,
            onUpdate: () => editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined),
        })
    }, [editor, value])

    return null
}
