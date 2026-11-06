import { UPLOAD_IMAGES } from '../lib/image-upload'
import { useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $patchStyleText } from '@lexical/selection'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { $getRoot, $isElementNode, $isTextNode, INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical'
import type { RangeSelection, TextNode } from 'lexical'
import { $createImageNode, isImageUrl } from '../nodes/ImageNode'
import { Tool } from '../components/EditorTool'

type Edit = (action: (selection: RangeSelection) => void, restoreFocus?: boolean) => void

const fonts = ['Arial', 'Georgia', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Courier New', 'system-ui', 'monospace']
const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 64, 72]
const emoji = [
    ['😀', 'grinning happy smile'], ['😂', 'laugh tears joy'], ['🙂', 'slightly smiling'],
    ['😊', 'blush happy'], ['😍', 'heart eyes love'], ['🥰', 'love hearts'], ['😎', 'cool sunglasses'],
    ['🤔', 'thinking'], ['😭', 'cry sad'], ['😅', 'sweat smile'], ['🥳', 'party celebration'],
    ['🤩', 'star eyes'], ['😴', 'sleep'], ['😮', 'surprise'], ['🙃', 'upside down'], ['🤯', 'mind blown'],
    ['👍', 'thumbs up yes'], ['👎', 'thumbs down no'], ['👏', 'clap applause'], ['🙌', 'hands celebrate'],
    ['🙏', 'thank you pray'], ['👋', 'wave hello'], ['🤝', 'handshake agreement'], ['💪', 'muscle strong'],
    ['❤️', 'red heart love'], ['💙', 'blue heart'], ['💚', 'green heart'], ['💜', 'purple heart'],
    ['✨', 'sparkles'], ['🔥', 'fire hot'], ['⭐', 'star'], ['🎉', 'tada party celebration'],
    ['✅', 'check done'], ['❌', 'cross wrong'], ['⚠️', 'warning'], ['❓', 'question'],
    ['💡', 'idea light bulb'], ['📌', 'pin'], ['📎', 'paperclip attachment'], ['🔗', 'link'],
    ['📝', 'note memo'], ['📚', 'books'], ['📅', 'calendar'], ['⏰', 'alarm clock'],
    ['💻', 'computer laptop'], ['📱', 'phone mobile'], ['🔍', 'search magnifying glass'], ['🔒', 'lock secure'],
    ['🚀', 'rocket launch'], ['🎯', 'target goal'], ['🏆', 'trophy award'], ['📈', 'growth chart'],
    ['🌍', 'earth globe world'], ['🌈', 'rainbow'], ['☀️', 'sun'], ['🌙', 'moon'],
    ['🌱', 'seedling plant'], ['🐱', 'cat'], ['🐶', 'dog'], ['🦋', 'butterfly'],
    ['☕', 'coffee'], ['🍕', 'pizza'], ['🎂', 'cake birthday'], ['🎁', 'gift'],
    ['©', 'copyright'], ['®', 'registered'], ['™', 'trademark'], ['°', 'degree'],
    ['±', 'plus minus'], ['×', 'multiply times'], ['÷', 'divide'], ['∞', 'infinity'],
    ['€', 'euro'], ['£', 'pound'], ['₦', 'naira'], ['→', 'right arrow'],
    ['←', 'left arrow'], ['•', 'bullet'], ['…', 'ellipsis'], ['—', 'em dash'],
]

function $matches(query: string) {
    if (!query) return []
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'giu')
    const matches: { node: TextNode; start: number; length: number }[] = []
    for (const node of $getRoot().getAllTextNodes()) {
        if (!node.isSimpleText()) continue
        for (const match of node.getTextContent().matchAll(pattern)) {
            matches.push({ node, start: match.index, length: match[0].length })
        }
    }
    return matches
}

export default function AdvancedTools({ edit, font, size, lineHeight, canUploadImages }: {
    canUploadImages?: boolean
    edit: Edit
    font: string
    size: string
    lineHeight: string
}) {
    const [editor] = useLexicalComposerContext()
    const [expanded, setExpanded] = useState(false)
    const [panel, setPanel] = useState<'emoji' | 'find' | 'image' | null>(null)
    const [query, setQuery] = useState('')
    const [replacement, setReplacement] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [alt, setAlt] = useState('')
    const [message, setMessage] = useState('')
    const [matchIndex, setMatchIndex] = useState(0)

    const open = (next: typeof panel) => {
        setQuery('')
        setMessage('')
        setMatchIndex(0)
        setPanel(panel === next ? null : next)
    }

    const findNext = () => {
        editor.update(() => {
            const matches = $matches(query)
            if (!matches.length) {
                setMessage('No matches')
                return
            }
            const index = matchIndex % matches.length
            const { node, start, length } = matches[index]
            node.select(start, start + length)
            setMessage(`Match ${index + 1} of ${matches.length}`)
            setMatchIndex(index + 1)
        })
    }

    const replaceAll = () => {
        editor.update(() => {
            const matches = $matches(query)
            for (const { node, start, length } of matches.reverse()) {
                node.spliceText(start, length, replacement, false)
            }
            setMessage(`${matches.length} replaced`)
            setMatchIndex(0)
        }, { tag: 'history-push' })
    }

    const insertImage = () => {
        if (!isImageUrl(imageUrl.trim())) {
            setMessage('Enter a complete HTTPS image URL.')
            return
        }
        edit(selection => selection.insertNodes([$createImageNode(imageUrl.trim(), alt)]), true)
        setPanel(null)
        setImageUrl('')
        setAlt('')
    }

    return <>
        <div className="rte-row rte-mobile-toggle">
            <Tool label={expanded ? 'Hide advanced tools' : 'Show advanced tools'} pressed={expanded}
                onClick={() => {
                    if (expanded) setPanel(null)
                    setExpanded(!expanded)
                }}>{expanded ? '− Fewer tools' : '+ More tools'}</Tool>
        </div>
        <div className="rte-row rte-advanced" data-expanded={expanded}>
            <select aria-label="Font family" value={fonts.includes(font) ? font : ''} onChange={event => {
                const value = event.target.value
                edit(selection => $patchStyleText(selection, { 'font-family': value || null }))
            }}>
                <option value="">Font family</option>
                {fonts.map(item => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="Font size" value={sizes.some(item => `${item}px` === size) ? size : ''} onChange={event => {
                const value = event.target.value
                edit(selection => $patchStyleText(selection, { 'font-size': value || null }))
            }}>
                <option value="">Size</option>
                {sizes.map(item => <option key={item} value={`${item}px`}>{item} px</option>)}
            </select>
            <select aria-label="Line height" value={lineHeight} onChange={event => {
                const value = event.target.value
                edit(selection => $patchStyleText(selection, { 'line-height': value || null }))
            }}>
                <option value="">Line height</option>
                {['1', '1.25', '1.5', '1.75', '2', '2.5', '3'].map(item => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="Text direction" value="" onChange={event => {
                const direction = event.target.value as 'ltr' | 'rtl' | 'auto'
                edit(selection => {
                    const blocks = new Set(selection.getNodes().map(node => node.getTopLevelElement()))
                    for (const block of blocks) {
                        if ($isElementNode(block)) block.setDirection(direction === 'auto' ? null : direction)
                    }
                })
            }}>
                <option value="" disabled>Direction</option>
                <option value="auto">Automatic</option>
                <option value="ltr">Left to right</option>
                <option value="rtl">Right to left</option>
            </select>
            <Tool label="Decrease indent" onClick={() => edit(() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined))}>⇤</Tool>
            <Tool label="Increase indent" onClick={() => edit(() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined))}>⇥</Tool>
            <Tool label="Clear formatting" onClick={() => edit(selection => {
                if (selection.isCollapsed()) {
                    selection.format = 0
                    selection.setStyle('')
                    return
                }
                for (const node of selection.extract()) {
                    if ($isTextNode(node)) node.setFormat(0).setStyle('')
                    if ($isElementNode(node)) node.setFormat('').setIndent(0)
                }
            })}>Clear style</Tool>
            <Tool label="Insert horizontal rule" onClick={() => edit(() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined))}>Divider</Tool>
            <Tool label="Emoji and symbols" pressed={panel === 'emoji'} onClick={() => open('emoji')}>😀 Emoji</Tool>
            <Tool label="Insert image" pressed={panel === 'image'} onClick={() => open('image')}>Image</Tool>
            <Tool label="Find and replace" pressed={panel === 'find'} onClick={() => open('find')}>Find</Tool>
        </div>
        {panel && <div className="rte-panel rte-extra-panel" role="group"
            aria-label={panel === 'emoji' ? 'Emoji picker' : panel === 'find' ? 'Find and replace settings' : 'Image settings'}
            onKeyDown={event => {
                if (event.key === 'Escape') {
                    setPanel(null)
                    editor.focus()
                }
                if (event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target.type !== 'file') {
                    event.preventDefault()
                    if (panel === 'find') findNext()
                    if (panel === 'image') insertImage()
                }
            }}>
            {panel === 'emoji' && <>
                <label>Search emoji <input autoFocus type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
                <div className="rte-emoji-grid">
                    {emoji.filter(([symbol, label]) => `${symbol} ${label}`.includes(query.trim().toLowerCase())).map(([symbol, label]) =>
                        <Tool key={symbol} label={label} onClick={() => {
                            edit(selection => selection.insertText(symbol), true)
                            setPanel(null)
                        }}>{symbol}</Tool>)}
                </div>
            </>}
            {panel === 'find' && <div className="rte-row">
                <label>Find <input autoFocus type="search" value={query} onChange={event => {
                    setQuery(event.target.value)
                    setMatchIndex(0)
                    setMessage('')
                }} /></label>
                <Tool label="Find next" disabled={!query} onClick={findNext}>Next</Tool>
                <label>Replace with <input value={replacement} onChange={event => setReplacement(event.target.value)} /></label>
                <Tool label="Replace all" disabled={!query} onClick={replaceAll}>Replace all</Tool>
            </div>}
            {panel === 'image' && <div className="rte-row">
                <label>Image URL <input autoFocus type="url" value={imageUrl} onChange={event => setImageUrl(event.target.value)} /></label>
                <label>Alt text <input value={alt} onChange={event => setAlt(event.target.value)} /></label>
                {canUploadImages && <label>Upload image
                    <input type="file" accept="image/*" multiple onChange={event => {
                        const files = Array.from(event.currentTarget.files ?? [])
                        event.currentTarget.value = ''
                        if (editor.dispatchCommand(UPLOAD_IMAGES, { files, alt })) setPanel(null)
                    }} />
                </label>}
                <Tool label="Add image" onClick={insertImage}>Insert</Tool>
            </div>}
            {message && <span role="status">{message}</span>}
            <Tool label="Close panel" onClick={() => {
                setPanel(null)
                editor.focus()
            }}>Close</Tool>
        </div>}
    </>
}
