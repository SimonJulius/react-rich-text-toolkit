import { $isTextNode, TextNode } from 'lexical'
import type { HTMLConfig } from 'lexical'

export function isAllowedUrl(url: string): boolean {
    try {
        const target = new URL(url, 'https://editor.invalid')
        return ['http:', 'https:', 'mailto:', 'tel:'].includes(target.protocol)
    } catch {
        return false
    }
}

export function parseEditorHtml(html: string): Document {
    const document = new DOMParser().parseFromString(html, 'text/html')
    document.querySelectorAll('script, style, iframe, object, embed, template').forEach(node => node.remove())
    document.querySelectorAll('a[href]').forEach(link => {
        if (!isAllowedUrl(link.getAttribute('href') ?? '')) link.replaceWith(...link.childNodes)
    })
    return document
}

export const editorHtml: HTMLConfig = {
    import: Object.fromEntries(Object.entries(TextNode.importDOM() ?? {}).filter(([tag]) => tag !== '#text').map(([tag, convert]) => [
        tag,
        (element: HTMLElement) => {
            if (tag === 'code' && (/[\r\n]/.test(element.textContent ?? '') || element.querySelector('br'))) return null
            const importer = convert(element)
            if (!importer) return null
            return {
                priority: 1,
                conversion: (node: HTMLElement) => {
                    const result = importer.conversion(node)
                    if (!result) return null
                    const styles = ['color', 'background-color', 'font-family', 'font-size', 'line-height'].flatMap(property => {
                        const value = node.style?.getPropertyValue(property)
                        return value ? [`${property}: ${value};`] : []
                    }).join(' ')
                    if (!styles) return result
                    return {
                        ...result,
                        forChild: (child, parent) => {
                            const converted = result.forChild ? result.forChild(child, parent) : child
                            if ($isTextNode(converted)) converted.setStyle(`${converted.getStyle()} ${styles}`.trim())
                            return converted
                        },
                    }
                },
            }
        },
    ])),
}
