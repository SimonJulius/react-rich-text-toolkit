import HtmlPastePlugin from '../plugins/HtmlPastePlugin.js'
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { FocusEventHandler, HTMLAttributes, ReactNode } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'
import type { CreateEditorArgs, EditorThemeClasses, HTMLConfig, LexicalEditor, SerializedEditorState } from 'lexical'
import { editorHtml } from '../lib/editor-html.js'
import { editorTheme } from '../lib/editor-theme.js'
import CustomOnChangePlugin from '../plugins/CustomOnChangePlugin.js'
import { readSnapshot } from '../lib/editor-state.js'
import type { RichTextChangeEvent, RichTextSnapshot } from '../lib/editor-state.js'

export type EditorInputEvents = Pick<HTMLAttributes<HTMLDivElement>,
    'onKeyDown' | 'onKeyUp' | 'onPaste' | 'onCopy' | 'onCut' | 'onDrop' | 'onCompositionStart' | 'onCompositionEnd'>

export interface EditorCoreProps {
    id?: string
    name?: string
    value?: string
    defaultValue?: string
    defaultState?: SerializedEditorState
    nodes?: CreateEditorArgs['nodes']
    onChange?: (html: string, event: RichTextChangeEvent) => void
    onFocus?: FocusEventHandler<HTMLDivElement>
    onBlur?: FocusEventHandler<HTMLDivElement>
    onError?: (error: Error, editor: LexicalEditor) => void
    label?: string
    labelledBy?: string
    describedBy?: string
    placeholder?: string
    invalid?: boolean
    readOnly?: boolean
    autoFocus?: boolean
    theme?: EditorThemeClasses
    htmlConfig?: HTMLConfig
    history?: boolean
    toolbar?: ReactNode
    surfaceControls?: ReactNode
    contentClassName?: string
    className?: string
    children?: ReactNode
    inputEvents?: EditorInputEvents
}

export type TextFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'highlight' | 'subscript' | 'superscript'

export interface RichTextEditorRef {
    formatText: (format: TextFormat) => void
    insertText: (text: string) => void
    focus: () => void
    blur: () => void
    getSnapshot: () => RichTextSnapshot | null
    getEditor: () => LexicalEditor | null
}

function EditorLifecycle({ readOnly, autoFocus, connect }: {
    readOnly: boolean
    autoFocus: boolean
    connect: (editor: LexicalEditor | null) => void
}) {
    const [editor] = useLexicalComposerContext()
    useLayoutEffect(() => {
        connect(editor)
        return () => connect(null)
    }, [connect, editor])
    useLayoutEffect(() => {
        editor.setEditable(!readOnly)
    }, [editor, readOnly])
    useLayoutEffect(() => {
        if (autoFocus && editor.isEditable()) editor.focus()
    }, [autoFocus, editor])
    return null
}

const EditorCore = forwardRef<RichTextEditorRef, EditorCoreProps>(function EditorCore({
    id, name, value, defaultValue, defaultState, nodes, onChange, onFocus, onBlur, onError,
    label = 'Rich text editor', labelledBy, describedBy, placeholder = 'Start writing…',
    invalid, readOnly = false, autoFocus = false, className, children, inputEvents,
    theme, htmlConfig, history = true, toolbar, surfaceControls, contentClassName,
}, ref) {
    const initialValue = useRef(defaultValue)
    const editorRef = useRef<LexicalEditor | null>(null)
    const errorHandler = useRef(onError)

    useLayoutEffect(() => {
        errorHandler.current = onError
    }, [onError])

    const connect = useRef((editor: LexicalEditor | null) => {
        editorRef.current = editor
    }).current

    useImperativeHandle(ref, () => ({
        formatText: format => {
            const editor = editorRef.current
            if (!editor?.isEditable()) return
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
        },
        insertText: text => {
            const editor = editorRef.current
            if (!editor?.isEditable()) return
            editor.update(() => {
                const selection = $getSelection() ?? $getRoot().selectEnd()
                if ($isRangeSelection(selection)) selection.insertText(text)
            })
        },
        focus: () => editorRef.current?.focus(),
        blur: () => editorRef.current?.getRootElement()?.blur(),
        getSnapshot: () => editorRef.current ? readSnapshot(editorRef.current) : null,
        getEditor: () => editorRef.current,
    }), [])


    return (
        <section className={className ? `rte ${className}` : 'rte'} data-invalid={invalid || undefined}>
            <LexicalComposer initialConfig={{
                namespace: name || 'RichTextEditor',
                editorState: defaultState && value === undefined && defaultValue === undefined
                    ? JSON.stringify(defaultState)
                    : undefined,
                editable: !readOnly,
                theme: {
                    ...editorTheme,
                    ...theme,
                    text: { ...editorTheme.text, ...theme?.text },
                    list: { ...editorTheme.list, ...theme?.list },
                    codeHighlight: { ...editorTheme.codeHighlight, ...theme?.codeHighlight },
                },
                html: { ...htmlConfig, import: { ...editorHtml.import, ...htmlConfig?.import } },
                onError: (error, editor) => {
                    if (errorHandler.current) errorHandler.current(error, editor)
                    else throw error
                },
                nodes,
            }}>
                {!readOnly && toolbar}
                <div className="rte-surface">
                    <RichTextPlugin
                        contentEditable={<ContentEditable
                            {...inputEvents}
                            id={id}
                            className={contentClassName ? `rte-input ${contentClassName}` : 'rte-input'}
                            ariaLabel={labelledBy ? undefined : label}
                            ariaLabelledBy={labelledBy}
                            ariaDescribedBy={describedBy}
                            aria-invalid={invalid}
                            ariaMultiline
                            aria-readonly={readOnly}
                            onFocus={onFocus}
                            onBlur={onBlur}
                        />}
                        placeholder={placeholder ? <div className="rte-placeholder" aria-hidden="true">{placeholder}</div> : null}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    {!readOnly && surfaceControls}
                </div>
                <HtmlPastePlugin />
                {history && <HistoryPlugin />}
                <CustomOnChangePlugin value={value ?? initialValue.current} onChange={onChange} />
                {children}
                <EditorLifecycle readOnly={readOnly} autoFocus={autoFocus} connect={connect} />
            </LexicalComposer>
        </section>
    )
})

export default EditorCore
