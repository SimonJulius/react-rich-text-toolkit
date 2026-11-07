import { INSERT_CODE_BLOCK } from '../lib/editor-commands.js'
import { resolveCodeLanguage } from '../lib/code-languages.js'
import { $getRoot, $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import '../lib/code-languages.js'
import { useLayoutEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createCodeNode, registerCodeHighlighting } from '@lexical/code'
import CodeFencePlugin from './CodeFencePlugin.js'

export interface CodeEditingPluginProps {
    shortcuts?: boolean
}

export function CodeEditingPlugin({ shortcuts = true }: CodeEditingPluginProps) {
    const [editor] = useLexicalComposerContext()
    useLayoutEffect(() => registerCodeHighlighting(editor), [editor])
    useLayoutEffect(() => editor.registerCommand(INSERT_CODE_BLOCK, language => {
        if (!editor.isEditable()) return false
        const selection = $getSelection() ?? $getRoot().selectEnd()
        if (!$isRangeSelection(selection)) return false
        $setBlocksType(selection, () => $createCodeNode(resolveCodeLanguage(language)))
        return true
    }, COMMAND_PRIORITY_EDITOR), [editor])
    return shortcuts ? <CodeFencePlugin /> : null
}
