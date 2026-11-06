import { useLayoutEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { DRAG_DROP_PASTE } from '@lexical/rich-text'
import { mergeRegister } from '@lexical/utils'
import { $getRoot, $getSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_LOW } from 'lexical'
import type { RangeSelection } from 'lexical'
import { EXTERNAL_VALUE } from '../lib/editor-state'
import { $createImageNode, isImageUrl } from '../nodes/ImageNode'

import { UPLOAD_IMAGES } from '../lib/image-upload'
import type { UploadImage } from '../lib/image-upload'

export default function ImageUploadPlugin({ uploadImage }: { uploadImage: UploadImage }) {
    const [editor] = useLexicalComposerContext()
    const [status, setStatus] = useState('')
    const uploader = useRef(uploadImage)
    useLayoutEffect(() => { uploader.current = uploadImage }, [uploadImage])

    useLayoutEffect(() => {
        const pending = new Set<AbortController>()
        let revision = 0
        let generation = 0
        let lastSelection: RangeSelection | null = null
        const cancel = () => {
            generation++
            for (const controller of pending) controller.abort()
            pending.clear()
        }
        const upload = ({ files, alt }: { files: File[]; alt: string }) => {
            const images = files.filter(file => file.type.startsWith('image/'))
            if (!editor.isEditable() || !images.length) return false

            const selection = $getSelection()
            const bookmark = ($isRangeSelection(selection) ? selection : lastSelection)?.clone()
            if (bookmark) bookmark.focus.set(bookmark.anchor.key, bookmark.anchor.offset, bookmark.anchor.type)
            const startRevision = revision
            const startGeneration = generation
            const controller = new AbortController()
            pending.add(controller)
            setStatus('Uploading images…')

            void Promise.allSettled(images.map(async file => {
                const url = await uploader.current(file, { signal: controller.signal })
                if (!isImageUrl(url)) throw new Error('Upload must return an HTTPS URL.')
                return url
            })).then(results => {
                if (controller.signal.aborted) return
                pending.delete(controller)
                const urls = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
                const failed = images.length - urls.length
                if (urls.length && editor.isEditable()) {
                    editor.update(() => {
                        if (startGeneration !== generation || !editor.isEditable()) return
                        if (bookmark && revision === startRevision) $setSelection(bookmark)
                        const target = bookmark && revision === startRevision ? bookmark : $getRoot().selectEnd()
                        target.insertNodes(urls.map(url => $createImageNode(url, alt)))
                        const root = editor.getRootElement()
                        if (root && root.ownerDocument.activeElement !== root) $setSelection(null)
                    }, { tag: 'history-push' })
                }
                setStatus(pending.size ? 'Uploading images…' : failed ? `${failed} image upload(s) failed.` : 'Images inserted.')
            })
            return true
        }

        const unregister = mergeRegister(
            editor.registerCommand(UPLOAD_IMAGES, upload, COMMAND_PRIORITY_LOW),
            editor.registerCommand(DRAG_DROP_PASTE, files => upload({ files, alt: '' }), COMMAND_PRIORITY_LOW),
            editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
                if (dirtyElements.size || dirtyLeaves.size) {
                    revision++
                    lastSelection = null
                }
                if (tags.has(EXTERNAL_VALUE)) {
                    cancel()
                    setStatus('')
                }
                editorState.read(() => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection)) lastSelection = selection.clone()
                })
            }),
            editor.registerEditableListener(editable => {
                if (!editable) {
                    cancel()
                    setStatus('')
                }
            }),
        )
        return () => {
            unregister()
            cancel()
        }
    }, [editor])

    return <div className="rte-upload-status" role="status">{status}</div>
}
