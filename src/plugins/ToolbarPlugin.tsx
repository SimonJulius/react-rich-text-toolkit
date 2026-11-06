import { Tool } from '../components/EditorTool'
import AdvancedTools from './AdvancedTools'
import { isAllowedUrl } from '../lib/editor-html'
import { EXTERNAL_VALUE } from '../lib/editor-state'
import { Fragment, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { $patchStyleText, $setBlocksType, $getSelectionStyleValueForProperty } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text'
import type { HeadingTagType } from '@lexical/rich-text'
import { $createCodeNode } from '@lexical/code'
import { $createLinkNode, $isLinkNode, $toggleLink } from '@lexical/link'
import {
    $isListNode, INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND,
} from '@lexical/list'
import {
    $isTableNode, $isTableCellNode, $insertTableRow__EXPERIMENTAL, $insertTableColumn__EXPERIMENTAL,
    $deleteTableRow__EXPERIMENTAL, $deleteTableColumn__EXPERIMENTAL, INSERT_TABLE_COMMAND,
} from '@lexical/table'
import {
    $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $setSelection,
    CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_LOW, FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND,
} from 'lexical'
import type { ElementFormatType, RangeSelection, TextFormatType } from 'lexical'

const formats: Array<[TextFormatType, string, ReactNode]> = [
    ['bold', 'Bold', <strong>B</strong>],
    ['italic', 'Italic', <em>I</em>],
    ['underline', 'Underline', <u>U</u>],
    ['strikethrough', 'Strikethrough', <s>S</s>],
    ['highlight', 'Highlight', <mark>H</mark>],
    ['code', 'Inline code', <code>&lt;/&gt;</code>],
    ['subscript', 'Subscript', <>X<sub>2</sub></>],
    ['superscript', 'Superscript', <>X<sup>2</sup></>],
]
const listCommands = {
    bullet: INSERT_UNORDERED_LIST_COMMAND,
    number: INSERT_ORDERED_LIST_COMMAND,
    check: INSERT_CHECK_LIST_COMMAND,
}
const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
const $createPlainCodeBlock = () => $createCodeNode('plain')

export interface ToolbarFeatures {
    code?: boolean
    lists?: boolean
    colors?: boolean
    links?: boolean
    tables?: boolean
    advanced?: boolean
    formats?: readonly TextFormatType[]
}

export default function ToolbarPlugin({ features = {}, canUploadImages }: { features?: ToolbarFeatures; canUploadImages?: boolean }) {
    const { code = true, lists = true, colors = true, links = true, tables = true, advanced = true, formats: allowedFormats } = features
    const [editor] = useLexicalComposerContext()
    const savedSelection = useRef<RangeSelection | null>(null)
    const [undo, setUndo] = useState(false)
    const [redo, setRedo] = useState(false)
    const [block, setBlock] = useState('paragraph')
    const [list, setList] = useState('')
    const [alignment, setAlignment] = useState('')
    const [active, setActive] = useState<TextFormatType[]>([])
    const [color, setColor] = useState('#000000')
    const [background, setBackground] = useState('#ffffff')
    const [font, setFont] = useState('')
    const [size, setSize] = useState('')
    const [lineHeight, setLineHeight] = useState('')
    const [link, setLink] = useState<string | null>(null)
    const [inCell, setInCell] = useState(false)
    const [panel, setPanel] = useState<'link' | 'table' | null>(null)
    const [url, setUrl] = useState('')
    const [rows, setRows] = useState('3')
    const [columns, setColumns] = useState('3')
    const [error, setError] = useState('')

    useEffect(() => {
        const update = () => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return
            savedSelection.current = selection.clone()
            const anchor = selection.anchor.getNode()
            const element = anchor.getTopLevelElement()
            const parentList = $findMatchingParent(anchor, $isListNode)
            const parentLink = $findMatchingParent(anchor, $isLinkNode)
            setBlock($isHeadingNode(element) ? element.getTag() : element?.getType() || 'paragraph')
            setFont($getSelectionStyleValueForProperty(selection, 'font-family', ''))
            setSize($getSelectionStyleValueForProperty(selection, 'font-size', ''))
            setLineHeight($getSelectionStyleValueForProperty(selection, 'line-height', ''))
            setAlignment(element?.getFormatType() || '')
            setList($isListNode(parentList) ? parentList.getListType() : '')
            setLink($isLinkNode(parentLink) ? parentLink.getURL() : null)
            setInCell(Boolean($findMatchingParent(anchor, $isTableCellNode)))
            setActive(formats.filter(([format]) => selection.hasFormat(format)).map(([format]) => format))
            setColor($getSelectionStyleValueForProperty(selection, 'color', '#000000'))
            setBackground($getSelectionStyleValueForProperty(selection, 'background-color', '#ffffff'))
        }
        editor.getEditorState().read(update)
        return mergeRegister(
            editor.registerUpdateListener(({ editorState, tags }) => {
                if (tags.has(EXTERNAL_VALUE)) savedSelection.current = null
                editorState.read(update)
            }),
            editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
                update()
                return false
            }, COMMAND_PRIORITY_LOW),
            editor.registerCommand(CAN_UNDO_COMMAND, value => {
                setUndo(value)
                return false
            }, COMMAND_PRIORITY_LOW),
            editor.registerCommand(CAN_REDO_COMMAND, value => {
                setRedo(value)
                return false
            }, COMMAND_PRIORITY_LOW),
        )
    }, [editor])

    const edit = (action: (selection: RangeSelection) => void, restoreFocus = false) => {
        editor.update(() => {
            let selection = $getSelection()
            if (!$isRangeSelection(selection) && savedSelection.current) {
                selection = savedSelection.current.clone()
                $setSelection(selection)
            }
            if (!$isRangeSelection(selection)) {
                const root = $getRoot()
                selection = root.selectEnd()
            }
            if ($isRangeSelection(selection)) action(selection)
        }, { onUpdate: restoreFocus ? () => editor.focus() : undefined })
    }

    const applyLink = () => {
        const value = url.trim()
        if (!value || !isAllowedUrl(value)) {
            setError('Enter a valid web, email, or phone link.')
            return
        }
        edit(selection => {
            const existingLink = $findMatchingParent(selection.anchor.getNode(), $isLinkNode)
            if (selection.isCollapsed() && !$isLinkNode(existingLink)) {
                const node = $createLinkNode(value)
                node.append($createTextNode(value).setFormat(selection.format).setStyle(selection.style))
                selection.insertNodes([node])
                return
            }
            $toggleLink(value)
        }, true)
        setPanel(null)
    }

    const applyTable = () => {
        if (![rows, columns].every(value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 20)) {
            setError('Enter between 1 and 20 rows and columns.')
            return
        }
        edit(() => editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows, columns, includeHeaders: { rows: true, columns: false } }), true)
        setPanel(null)
    }

    return <div className="rte-tools" role="group" aria-label="Formatting controls">
        <div className="rte-row rte-format-row">
            <Tool label="Undo" disabled={!undo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>↶</Tool>
            <Tool label="Redo" disabled={!redo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>↷</Tool>
            <select aria-label="Paragraph style" value={['paragraph', 'quote', 'code', ...headings].includes(block) ? block : ''}
                onChange={event => {
                    const value = event.target.value
                    edit(selection => {
                        if (value === 'quote') $setBlocksType(selection, $createQuoteNode)
                        else if (value === 'code') $setBlocksType(selection, $createPlainCodeBlock)
                        else if (headings.includes(value)) $setBlocksType(selection, () => $createHeadingNode(value as HeadingTagType))
                        else $setBlocksType(selection, $createParagraphNode)
                    })
                }}>
                <option value="" disabled>Block style</option>
                <option value="paragraph">Normal text</option>
                {headings.map((heading, index) => <option key={heading} value={heading}>Heading {index + 1}</option>)}
                <option value="quote">Quote</option>
                {code && <option value="code">Code block</option>}
            </select>
            {formats.filter(([format]) => (format !== 'code' || code) && (allowedFormats?.includes(format) ?? true))
                .map(([format, label, icon]) =>
                <Fragment key={format}>
                    <Tool label={label} pressed={active.includes(format)}
                        onClick={() => edit(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format))}>{icon}</Tool>
                    {format === 'code' && <Tool label="Code block" pressed={block === 'code'} onClick={() =>
                        edit(selection => $setBlocksType(selection, block === 'code' ? $createParagraphNode : $createPlainCodeBlock))}>
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                            strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="2" y="3.5" width="16" height="13" rx="2" />
                            <path d="m8 8-2 2 2 2m4-4 2 2-2 2" />
                        </svg>
                    </Tool>}
                </Fragment>)}
            <select aria-label="Alignment" value={alignment}
                onChange={event => {
                    const value = event.target.value as ElementFormatType
                    edit(() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value))
                }}>
                <option value="">Default alignment</option>
                <option value="left">Align left</option>
                <option value="center">Align center</option>
                <option value="right">Align right</option>
                <option value="justify">Justify</option>
                <option value="start">Align start</option>
                <option value="end">Align end</option>
            </select>
        </div>
        <div className="rte-row">
            {lists && ([['bullet', 'Bullet list'], ['number', 'Numbered list'], ['check', 'Checklist']] as const).map(([type, label]) =>
                <Tool key={type} label={label} pressed={list === type}
                    onClick={() => edit(() => editor.dispatchCommand(list === type ? REMOVE_LIST_COMMAND : listCommands[type], undefined))}>{label}</Tool>)}
            {colors && <><label className="rte-color">Text
                <input type="color" aria-label="Text color" value={/^#[\da-f]{6}$/i.test(color) ? color : '#000000'}
                    onChange={event => {
                        const value = event.target.value
                        edit(selection => $patchStyleText(selection, { color: value }))
                    }} />
            </label>
            <label className="rte-color">Fill
                <input type="color" aria-label="Text background color" value={/^#[\da-f]{6}$/i.test(background) ? background : '#ffffff'}
                    onChange={event => {
                        const value = event.target.value
                        edit(selection => $patchStyleText(selection, { 'background-color': value }))
                    }} />
            </label>
            </>}
            {links && <Tool label={link ? 'Edit link' : 'Insert link'} pressed={panel === 'link'}
                onClick={() => {
                    setUrl(link || '')
                    setError('')
                    setPanel(panel === 'link' ? null : 'link')
                }}>Link</Tool>}
            {links && link && <Tool label="Remove link" onClick={() => edit(() => $toggleLink(null))}>Unlink</Tool>}
            {tables && <Tool label="Insert table" disabled={inCell} pressed={panel === 'table'} onClick={() => {
                setError('')
                setPanel(panel === 'table' ? null : 'table')
            }}>Table</Tool>}
            {tables && inCell && <>
                <Tool label="Add row below" onClick={() => edit(() => $insertTableRow__EXPERIMENTAL(true))}>+ Row</Tool>
                <Tool label="Add column after" onClick={() => edit(() => $insertTableColumn__EXPERIMENTAL(true))}>+ Column</Tool>
                <Tool label="Delete row" onClick={() => edit(() => $deleteTableRow__EXPERIMENTAL())}>− Row</Tool>
                <Tool label="Delete column" onClick={() => edit(() => $deleteTableColumn__EXPERIMENTAL())}>− Column</Tool>
                <Tool label="Delete table" onClick={() => edit(selection => {
                    const table = $findMatchingParent(selection.anchor.getNode(), $isTableNode)
                    if ($isTableNode(table)) table.replace($createParagraphNode()).select()
                })}>Delete table</Tool>
            </>}
        </div>
        {advanced && <AdvancedTools canUploadImages={canUploadImages} edit={edit} font={font} size={size} lineHeight={lineHeight} />}
        {panel && (panel === 'link' ? links : tables) && <div className="rte-row rte-panel" role="group" aria-label={panel === 'link' ? 'Link settings' : 'Table settings'}
            onKeyDown={event => {
                if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
                    event.preventDefault()
                    if (panel === 'link') applyLink()
                    else applyTable()
                }
                if (event.key === 'Escape') {
                    setPanel(null)
                    editor.focus()
                }
            }}>
            {panel === 'link' ? <>
                <label>URL <input autoFocus value={url} onChange={event => setUrl(event.target.value)} /></label>
                <Tool label="Apply link" onClick={applyLink}>Apply</Tool>
            </> : <>
                <label>Rows <input autoFocus type="number" min="1" max="20" value={rows} onChange={event => setRows(event.target.value)} /></label>
                <label>Columns <input type="number" min="1" max="20" value={columns} onChange={event => setColumns(event.target.value)} /></label>
                <Tool label="Create table" onClick={applyTable}>Insert</Tool>
            </>}
            <Tool label="Cancel" onClick={() => {
                setPanel(null)
                editor.focus()
            }}>Cancel</Tool>
            {error && <span role="alert">{error}</span>}
        </div>}
    </div>
}
