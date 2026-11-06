import { useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'

export default function ImageView({ src, alt, save, remove }: {
    src: string
    alt: string
    save: (alt: string) => void
    remove: () => void
}) {
    const [editor] = useLexicalComposerContext()
    const editable = useLexicalEditable()
    const [draft, setDraft] = useState<string | null>(null)
    const saveAlt = () => {
        editor.update(() => save(draft ?? alt), { tag: 'history-push' })
        setDraft(null)
    }
    return <>
        {src ? <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" draggable={false} /> : <span>{alt}</span>}
        {editable && <details className="rte-image-options" onToggle={event => {
            if (!event.currentTarget.open) setDraft(null)
        }}>
            <summary>Image options</summary>
            <div className="rte-row">
                <label>Alt text <input value={draft ?? alt} onChange={event => setDraft(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            saveAlt()
                        }
                    }} /></label>
                <button type="button" onClick={saveAlt} disabled={draft === null}>Save alt text</button>
                <button type="button" onClick={() => {
                    editor.update(remove, { tag: 'history-push', onUpdate: () => editor.focus() })
                }}>Remove image</button>
            </div>
        </details>}
    </>
}
