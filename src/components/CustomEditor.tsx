import ImageUploadPlugin from '../plugins/ImageUploadPlugin.js'
import type { UploadImage } from '../lib/image-upload.js'
import { forwardRef } from 'react'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table'
import EditorCore from './EditorCore.js'
import type { EditorCoreProps, RichTextEditorRef } from './EditorCore.js'
import { CodeEditingPlugin, CodeLanguagePicker, codeNodes } from '../code.js'
import { ImageNode } from '../nodes/ImageNode.js'
import { isAllowedUrl } from '../lib/editor-html.js'
import ToolbarPlugin from '../plugins/ToolbarPlugin.js'
import type { ToolbarFeatures } from '../plugins/ToolbarPlugin.js'

export interface RichTextEditorProps extends EditorCoreProps {
    showToolbar?: boolean
    toolbarFeatures?: ToolbarFeatures
    markdownShortcuts?: boolean
    uploadImage?: UploadImage
}

const defaultNodes = [
    HeadingNode, QuoteNode, ...codeNodes, ListItemNode, ListNode,
    LinkNode, HorizontalRuleNode, ImageNode, TableNode, TableCellNode, TableRowNode,
]

export default forwardRef<RichTextEditorRef, RichTextEditorProps>(function RichTextEditor({
    showToolbar = true, toolbarFeatures, markdownShortcuts = true, nodes, toolbar, surfaceControls, children, uploadImage, ...props
}, ref) {
    const defaultToolbar = <ToolbarPlugin features={toolbarFeatures} canUploadImages={Boolean(uploadImage)} />
    const defaultSurfaceControls = toolbarFeatures?.code === false ? null : <CodeLanguagePicker />
    return (
        <EditorCore
            {...props}
            ref={ref}
            nodes={nodes ? [...defaultNodes, ...nodes] : defaultNodes}
            toolbar={showToolbar && (toolbar === undefined ? defaultToolbar : toolbar)}
            surfaceControls={showToolbar && (surfaceControls === undefined ? defaultSurfaceControls : surfaceControls)}
        >
            <CodeEditingPlugin shortcuts={markdownShortcuts} />
            <HorizontalRulePlugin />
            {markdownShortcuts && <MarkdownShortcutPlugin />}
            <ListPlugin />
            <CheckListPlugin />
            <LinkPlugin validateUrl={isAllowedUrl} />
            <TablePlugin />
            {uploadImage && <ImageUploadPlugin uploadImage={uploadImage} />}
            {children}
        </EditorCore>
    )
})
