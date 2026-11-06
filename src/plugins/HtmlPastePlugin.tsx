import { useLayoutEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertGeneratedNodes } from '@lexical/clipboard'
import { $generateNodesFromDOM } from '@lexical/html'
import { $addUpdateTag, $getSelection, COMMAND_PRIORITY_LOW, isSelectionCapturedInDecoratorInput, PASTE_COMMAND } from 'lexical'
import { parseEditorHtml } from '../lib/editor-html'

export default function HtmlPastePlugin() {
    const [editor] = useLexicalComposerContext()

    useLayoutEffect(() => editor.registerCommand(PASTE_COMMAND, event => {
        if (!editor.isEditable() || event.defaultPrevented || (event.target instanceof Node && isSelectionCapturedInDecoratorInput(event.target))) return false
        const clipboard = 'clipboardData' in event ? event.clipboardData : null
        if (!clipboard || clipboard.getData('application/x-lexical-editor')) return false

        const html = clipboard.getData('text/html')
        const selection = $getSelection()
        if (!html || !selection) return false

        const nodes = $generateNodesFromDOM(editor, parseEditorHtml(html))
        if (!nodes.length) return false
        event.preventDefault()
        $addUpdateTag('paste')
        $insertGeneratedNodes(editor, nodes, selection)
        return true
    }, COMMAND_PRIORITY_LOW), [editor])

    return null
}
