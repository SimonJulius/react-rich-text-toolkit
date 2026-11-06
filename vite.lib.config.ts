import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    publicDir: false,
    build: {
        outDir: 'dist/library',
        lib: { entry: { index: 'src/library.ts', core: 'src/core.ts', code: 'src/code.ts' }, formats: ['es'], fileName: (_format, entry) => `${entry}.js` },
        rollupOptions: {
            external: /^(react(?:-dom)?|lexical|prismjs|@lexical\/[^/]+)(\/|$)/,
            output: {
                banner: "'use client';",
                assetFileNames: 'editor[extname]',
            },
        },
    },
})
