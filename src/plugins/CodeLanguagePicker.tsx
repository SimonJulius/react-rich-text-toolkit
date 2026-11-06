import { useLayoutEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isCodeNode } from '@lexical/code'
import { $findMatchingParent } from '@lexical/utils'
import { $getNodeByKey, $getSelection, $isRangeSelection, $setSelection } from 'lexical'
import type { RangeSelection } from 'lexical'
import { codeLanguages, resolveCodeLanguage } from '../lib/code-languages'

export default function CodeLanguagePicker() {
    const [editor] = useLexicalComposerContext()
    const layerRef = useRef<HTMLDivElement>(null)
    const savedSelection = useRef<RangeSelection | null>(null)
    const [active, setActive] = useState<{ key: string; language: string } | null>(null)
    const key = active?.key

    useLayoutEffect(() => {
        const layer = layerRef.current
        if (!layer) return

        const sync = () => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
                if (!layer.contains(layer.ownerDocument.activeElement)) setActive(null)
                return
            }
            const node = $findMatchingParent(selection.anchor.getNode(), $isCodeNode)
            if (!$isCodeNode(node)) {
                setActive(null)
                return
            }
            savedSelection.current = selection.clone()
            const next = { key: node.getKey(), language: resolveCodeLanguage(node.getLanguage()) }
            setActive(previous => previous?.key === next.key && previous.language === next.language ? previous : next)
        }
        const onFocus = (event: FocusEvent) => {
            if (event.target instanceof Node && !layer.contains(event.target) && !editor.getRootElement()?.contains(event.target)) {
                setActive(null)
            }
        }
        editor.getEditorState().read(sync)
        const unregister = editor.registerUpdateListener(({ editorState }) => editorState.read(sync))
        layer.ownerDocument.addEventListener('focusin', onFocus)
        return () => {
            unregister()
            layer.ownerDocument.removeEventListener('focusin', onFocus)
        }
    }, [editor])

    useLayoutEffect(() => {
        const layer = layerRef.current
        const surface = layer?.parentElement
        const root = editor.getRootElement()
        const block = key ? editor.getElementByKey(key) : null
        if (!layer || !surface || !root || !block) return

        const position = () => {
            const bounds = surface.getBoundingClientRect()
            const code = block.getBoundingClientRect()
            const visible = root.getBoundingClientRect()
            const right = Math.min(code.right, visible.right)
            const left = Math.max(code.left, visible.left)
            layer.style.top = `${code.top - bounds.top + 6}px`
            layer.style.right = `${bounds.right - right + 6}px`
            layer.style.maxWidth = `${Math.max(0, right - left - 12)}px`
        }
        block.classList.add('rte-code-picker-active')
        position()
        const observer = new ResizeObserver(position)
        observer.observe(root)
        observer.observe(block)
        root.addEventListener('scroll', position, true)
        const unregister = editor.registerUpdateListener(position)
        return () => {
            unregister()
            observer.disconnect()
            root.removeEventListener('scroll', position, true)
            block.classList.remove('rte-code-picker-active')
        }
    }, [editor, key])

    return <div ref={layerRef} className="rte-code-language">
        {active && <select aria-label="Code language" value={active.language} onChange={event => {
            const language = event.target.value
            editor.update(() => {
                const block = $getNodeByKey(active.key)
                if (!$isCodeNode(block)) return
                if (!$isRangeSelection($getSelection()) && savedSelection.current) {
                    $setSelection(savedSelection.current.clone())
                }
                block.setLanguage(language)
            }, { tag: 'history-push', onUpdate: () => editor.focus() })
        }}>
            {!codeLanguages.some(item => item.value === active.language) && <option value={active.language}>{active.language}</option>}
            {codeLanguages.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>}
    </div>
}
