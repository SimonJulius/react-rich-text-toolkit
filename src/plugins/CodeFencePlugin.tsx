import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createCodeNode, $isCodeNode } from '@lexical/code'
import {
    $createParagraphNode, $getSelection, $isLineBreakNode, $isParagraphNode,
    $isRangeSelection, $isRootOrShadowRoot, $isTextNode,
} from 'lexical'

const FENCE = '```'

function $getFence() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null

    const anchor = selection.anchor.getNode()
    if (!$isTextNode(anchor) || anchor.hasFormat('code') || anchor.getNextSibling()
        || selection.anchor.offset !== anchor.getTextContentSize()) return null

    const block = anchor.getParent()
    if ($isParagraphNode(block) && $isRootOrShadowRoot(block.getParent())
        && block.getChildrenSize() === 1 && anchor.getTextContent() === FENCE) {
        return { block, anchor, nodes: [anchor] }
    }
    if (!$isCodeNode(block)) return null

    const nodes = [anchor]
    let text = anchor.getTextContent()
    let previous = anchor.getPreviousSibling()
    while ($isTextNode(previous) && text.length <= FENCE.length) {
        text = previous.getTextContent() + text
        nodes.push(previous)
        previous = previous.getPreviousSibling()
    }
    if (text !== FENCE || (previous && !$isLineBreakNode(previous))) return null
    return { block, anchor, nodes }
}

export default function CodeFencePlugin() {
    const [editor] = useLexicalComposerContext()

    useEffect(() => editor.registerUpdateListener(({ editorState, dirtyLeaves, tags }) => {
        if (!dirtyLeaves.size || editor.isComposing() || tags.has('historic') || tags.has('paste')) return
        const fence = editorState.read($getFence)
        if (!fence || !dirtyLeaves.has(fence.anchor.getKey())) return

        editor.update(() => {
            const current = $getFence()
            if (!current || !current.anchor.is(fence.anchor)) return

            const { block, nodes } = current
            if ($isParagraphNode(block)) {
                const code = $createCodeNode('plain')
                block.replace(code)
                code.selectStart()
            } else {
                const separator = nodes[nodes.length - 1].getPreviousSibling()
                for (const node of nodes) node.remove()
                if ($isLineBreakNode(separator)) separator.remove()
                const paragraph = $createParagraphNode()
                block.insertAfter(paragraph)
                paragraph.selectStart()
            }
        }, { tag: 'history-push' })
    }), [editor])

    return null
}
