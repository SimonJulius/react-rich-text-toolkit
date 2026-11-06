import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

test('a document with an image can be exported and reopened from JSON', async () => {
    const vite = await createServer({
        configFile: false,
        server: { middlewareMode: true, ws: false, hmr: false, watch: null },
    })

    try {
        const { $getRoot, createEditor } = await import('lexical')
        const { ImageNode, $createImageNode } = await vite.ssrLoadModule('/src/nodes/ImageNode.tsx')
        const source = createEditor({ nodes: [ImageNode] })
        source.update(() => {
            $getRoot().append($createImageNode('https://example.com/chart.png', 'Sales chart'))
        }, { discrete: true })

        const saved = JSON.stringify(source.getEditorState())
        const restored = createEditor({ nodes: [ImageNode] })
        restored.setEditorState(restored.parseEditorState(saved))

        assert.deepEqual(restored.getEditorState().toJSON().root.children, [{
            type: 'rte-image',
            version: 1,
            src: 'https://example.com/chart.png',
            alt: 'Sales chart',
        }])
    } finally {
        await vite.close()
    }
})
