import ImageView from '../components/ImageView'
import { $applyNodeReplacement, $getNodeByKey, DecoratorNode } from 'lexical'
import type { DOMConversionMap, DOMExportOutput, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import type { ReactElement } from 'react'

type SerializedImage = Spread<{ src: string; alt: string }, SerializedLexicalNode>

export function isImageUrl(value: string): boolean {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && !url.username && !url.password
    } catch {
        return false
    }
}

export class ImageNode extends DecoratorNode<ReactElement> {
    __src: string
    __alt: string

    static getType() { return 'rte-image' }

    static clone(node: ImageNode) { return new ImageNode(node.__src, node.__alt, node.__key) }

    static importJSON(node: SerializedImage) { return $createImageNode(node.src, node.alt) }

    static importDOM(): DOMConversionMap {
        return {
            img: () => ({
                priority: 1,
                conversion: element => {
                    const src = element.getAttribute('src') || ''
                    return { node: isImageUrl(src) ? $createImageNode(src, element.getAttribute('alt') || '') : null }
                },
            }),
        }
    }

    constructor(src: string, alt: string, key?: NodeKey) {
        super(key)
        this.__src = isImageUrl(src) ? src : ''
        this.__alt = alt
    }

    exportJSON(): SerializedImage {
        return { type: ImageNode.getType(), version: 1, src: this.__src, alt: this.__alt }
    }

    exportDOM(): DOMExportOutput {
        if (!this.__src) return { element: null }
        const img = document.createElement('img')
        img.src = this.__src
        img.alt = this.__alt
        img.referrerPolicy = 'no-referrer'
        return { element: img }
    }

    createDOM() {
        const container = document.createElement('figure')
        container.className = 'rte-image'
        return container
    }

    updateDOM() { return false }

    isInline() { return false }

    getTextContent() { return this.__alt }

    setAlt(alt: string) { this.getWritable().__alt = alt }

    decorate(): ReactElement {
        const key = this.__key
        return <ImageView src={this.__src} alt={this.__alt}
            save={alt => {
                const node = $getNodeByKey(key)
                if (node instanceof ImageNode) node.setAlt(alt)
            }}
            remove={() => $getNodeByKey(key)?.remove()}
        />
    }
}

export function $createImageNode(src: string, alt: string): LexicalNode {
    return $applyNodeReplacement(new ImageNode(src, alt))
}
