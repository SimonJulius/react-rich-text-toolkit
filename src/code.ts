import { CodeHighlightNode, CodeNode } from '@lexical/code'

export { default as CodeLanguagePicker } from './plugins/CodeLanguagePicker.js'
export { CodeEditingPlugin } from './plugins/CodeEditingPlugin.js'

export const codeNodes = [CodeNode, CodeHighlightNode] as const

export type { CodeEditingPluginProps } from './plugins/CodeEditingPlugin.js'
