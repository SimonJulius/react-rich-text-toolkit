import '../lib/code-languages.js'
import { useLayoutEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { registerCodeHighlighting } from '@lexical/code'
import CodeFencePlugin from './CodeFencePlugin.js'

export interface CodeEditingPluginProps {
    shortcuts?: boolean
}

export function CodeEditingPlugin({ shortcuts = true }: CodeEditingPluginProps) {
    const [editor] = useLexicalComposerContext()
    useLayoutEffect(() => registerCodeHighlighting(editor), [editor])
    return shortcuts ? <CodeFencePlugin /> : null
}
