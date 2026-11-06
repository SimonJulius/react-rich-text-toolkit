# React Rich Text Toolkit

A responsive rich-text editor for React, powered by [Lexical](https://lexical.dev/). This package wraps Lexical with a ready-to-use editor, toolbar, scoped styles, and APIs for saving and restoring HTML or Lexical JSON. Lexical provides the editing engine and document model. Use the core entry point to supply your own controls, nodes, and plugins.

[Install](#install) · [Quick start](#quick-start) · [TypeScript](#typescript) · [Save and restore](#read-and-restore-editor-content) · [API reference](#api-reference) · [Customize](#configure-the-built-in-editor) · [Lightweight setup](#build-a-smaller-editor) · [Image uploads](#upload-images) · [Troubleshooting](#troubleshooting)

| Import | Use it for |
| --- | --- |
| `react-rich-text-toolkit` | A complete React editor with built-in tools for formatting, links, images, tables, and code. |
| `react-rich-text-toolkit/core` | An editing surface with HTML and JSON support. Choose the Lexical nodes, plugins, and controls your app needs. |
| `react-rich-text-toolkit/code` | Optional code nodes, syntax highlighting, fenced-code shortcuts, and a language picker for the core. |
| `react-rich-text-toolkit/editor.css` | The default responsive styles for either editor. |

## Install

Use React and React DOM 18.3.1 or a later compatible React 18 release. Install from npm once the package has been published.

```sh
npm install react-rich-text-toolkit
```

With Yarn, run `yarn add react-rich-text-toolkit`. To try a local build before publication, run `npm pack` in the editor repository and install the generated archive in your application with `npm install /path/to/react-rich-text-toolkit-0.1.0.tgz`.

## Quick start

Import the component and load its stylesheet once. For frameworks that require global CSS imports in a shared entry point, put the stylesheet import there. In a framework with React Server Components, put components that use hooks or pass event handlers in a client module.

```tsx
import { RichTextEditor } from 'react-rich-text-toolkit'
import 'react-rich-text-toolkit/editor.css'

export function NotesEditor() {
    return (
        <RichTextEditor
            label="Notes"
            placeholder="Write your notes…"
            defaultValue="<p>Start here</p>"
        />
    )
}
```

## TypeScript

The package ships declarations for the full editor, the core, the code module, and the stylesheet import. Use an ESM project with TypeScript's `bundler` or `NodeNext` module resolution. The examples use TypeScript 5.5 and React 18 types.

```tsx
import { useRef } from 'react'
import { RichTextEditor, type RichTextEditorProps, type RichTextEditorRef } from 'react-rich-text-toolkit'
import 'react-rich-text-toolkit/editor.css'

const props = {
    label: 'Notes',
    toolbarFeatures: { formats: ['bold', 'italic'] },
    onChange(_html, event) {
        console.log(event.text)
    },
} satisfies RichTextEditorProps

export function TypedEditor() {
    const editor = useRef<RichTextEditorRef>(null)
    return <RichTextEditor {...props} ref={editor} />
}
```

Use `EditorInputEvents` to type handlers defined outside the editor props. The code module exports `CodeEditingPluginProps` for its options.

## Control the value and submit a form

Use `value` when the host application owns the HTML. Feed changes back into React state immediately. If you debounce saving, debounce the persistence call rather than the state update. Set the value to an empty string to clear the editor.

```tsx
import { useState } from 'react'
import { RichTextEditor } from 'react-rich-text-toolkit'

export function ArticleForm({ onSave }: { onSave: (html: string) => void }) {
    const [html, setHtml] = useState('<p>Draft your article here.</p>')

    return (
        <form onSubmit={event => {
            event.preventDefault()
            onSave(html)
        }}>
            <RichTextEditor label="Article body" value={html} onChange={setHtml} />
            <button type="submit">Save article</button>
            <button type="button" onClick={() => setHtml('')}>Clear</button>
        </form>
    )
}
```

The editable surface is a custom React component. Read the editor value from React state or a ref when submitting. The `name` prop sets Lexical's namespace.

## Read and restore editor content

`onChange(html, event)` receives a `RichTextChangeEvent` with `html`, `text`, `json`, `isEmpty`, `editorState`, and `tags`. Use `event.json` to preserve Lexical document structure, `event.html` for HTML interchange, and `event.text` for plain-text previews. Initialize a new editor with saved Lexical JSON using `defaultState`. Register the same custom nodes when restoring a document that uses them.

Use a ref when you need to read content on demand.

```tsx
import { useRef } from 'react'
import { RichTextEditor, type RichTextEditorRef } from 'react-rich-text-toolkit'

export function SnapshotEditor({ onExport }: { onExport: (json: string) => void }) {
    const editor = useRef<RichTextEditorRef>(null)

    return (
        <>
            <RichTextEditor ref={editor} label="Document" />
            <button type="button" onClick={() => {
                const snapshot = editor.current?.getSnapshot()
                if (snapshot) onExport(JSON.stringify(snapshot.json))
            }}>
                Export JSON
            </button>
        </>
    )
}
```

To reopen saved JSON, deserialize it in your application and pass the resulting object as `defaultState`. Use a different React `key` when switching documents so each document gets its own editor and undo history.

```tsx
import { RichTextEditor, type RichTextSnapshot } from 'react-rich-text-toolkit'

export function SavedDocument({
    documentId,
    savedState,
}: {
    documentId: string
    savedState: RichTextSnapshot['json']
}) {
    return (
        <RichTextEditor
            key={documentId}
            label="Saved document"
            defaultState={savedState}
            readOnly
        />
    )
}
```

HTML import normalizes markup to supported nodes. Sanitize untrusted HTML before rendering it elsewhere in your application.

### Choose a storage format

| Value | Use it for |
| --- | --- |
| `snapshot.json` | Saving an editable document with Lexical node structure and metadata. Restore it with `defaultState`. |
| `snapshot.html` | Sharing content with HTML consumers or loading HTML into another editor. Restore it with `defaultValue` or `value`. |
| `snapshot.text` | Plain-text previews and search indexing. |
| `snapshot.isEmpty` | Checking whether the editor contains only its empty document state. Apply your own validation rules for content such as whitespace or image-only documents. |

The same fields appear on the change event. It also includes the Lexical `editorState` and the update's `tags`. Persist the serialized `json` field when you need to reopen an editable document.

### Label the editor and describe errors

Use `label` for a standalone accessible name. If the form already has a visible label, give it an ID and pass that ID to `labelledBy`. Pass hint and error IDs through `describedBy` and use `invalid` to expose validation state.

```tsx
import { useId } from 'react'
import { RichTextEditor } from 'react-rich-text-toolkit'

export function ArticleBody({ error }: { error?: string }) {
    const labelId = useId()
    const hintId = useId()
    const errorId = useId()

    return (
        <>
            <p id={labelId}>Article body</p>
            <p id={hintId}>Add text, links, or a code block.</p>
            <RichTextEditor
                labelledBy={labelId}
                describedBy={error ? `${hintId} ${errorId}` : hintId}
                invalid={Boolean(error)}
            />
            {error && <p id={errorId}>{error}</p>}
        </>
    )
}
```

## API reference

| Prop | Behavior |
| --- | --- |
| `value` | Controlled HTML string. A different external value replaces the document and resets undo history. |
| `defaultValue` | Initial HTML for an uncontrolled editor. |
| `defaultState` | Initial serialized Lexical state. HTML supplied through `value` or `defaultValue` takes precedence. |
| `onChange` | Receives `(html, event)` for editor content changes. Initial values and replacements from props are applied silently. |
| `label`, `labelledBy`, `describedBy` | Accessible name and description. Use `labelledBy` for a visible label by ID. The fallback label is “Rich text editor.” |
| `id`, `invalid`, `placeholder` | Editable element ID, validation state, and empty editor hint. The default hint is “Start writing…”. |
| `readOnly` | Defaults to `false`. Set to `true` to disable editing and hide editing controls. |
| `showToolbar` | Defaults to `true`. Set to `false` to hide the formatting toolbar and code language picker. |
| `autoFocus` | Defaults to `false`. Requests focus on mount when the editor is editable. |
| `onFocus`, `onBlur` | React focus events from the editable surface. |
| `onError` | Receives `(error, editor)` when Lexical reports an error. |
| `inputEvents` | Supports `onKeyDown`, `onKeyUp`, `onPaste`, `onCopy`, `onCut`, `onDrop`, `onCompositionStart`, and `onCompositionEnd`. |
| `className`, `contentClassName` | Add CSS classes to the outer wrapper and the editable element, respectively. |
| `theme`, `htmlConfig` | Customize Lexical node classes and HTML conversions. Both are applied at mount. |
| `toolbar`, `surfaceControls` | Supply React elements for the toolbar and the editing surface. Pass `null` to remove a slot. |
| `history` | Defaults to `true`. Set to `false` to omit the built-in history plugin. |
| `uploadImage` | Full editor only. Uploads local image files using a callback supplied by your application. |
| `toolbarFeatures` | Full editor only. Configure which built-in toolbar controls are visible. |
| `markdownShortcuts` | Full editor only. Defaults to `true`. Set to `false` to disable Markdown typing shortcuts, including code fences. |
| `name` | Lexical namespace. Defaults to `RichTextEditor`. |
| `nodes`, `children` | Register custom Lexical nodes at mount and render plugins inside the Lexical composer. |

The exported `RichTextEditorRef` exposes `focus()`, `blur()`, `getSnapshot()`, and `getEditor()`. The last two return `null` when no editor is mounted. The package also exports `RichTextEditorProps`, `RichTextSnapshot`, and `RichTextChangeEvent`.

## Customize the theme

Pass a class to the editor, for example `<RichTextEditor className="article-editor" label="Article" />`, and set CSS variables on it.

```css
.article-editor {
    --rte-accent: #6d28d9;
    --rte-border: #d8d1e5;
    --rte-min-height: 14rem;
}
```

Other theme variables include `--rte-ink`, `--rte-muted`, `--rte-toolbar`, `--rte-surface`, and `--rte-active`. The toolbar adapts to the editor's container width. On narrow layouts, advanced actions appear under **More tools**.

## Configure the built-in editor

The standard editor includes the built-in document types so it can reopen saved documents even if a toolbar control has been hidden. Use `toolbarFeatures` to control the editing UI. This configuration hides controls and does not restrict imported content, Markdown commands, or Lexical plugins.

```tsx
<RichTextEditor
    label="Comment"
    toolbarFeatures={{
        formats: ['bold', 'italic', 'code'],
        colors: false,
        tables: false,
        advanced: false,
    }}
    markdownShortcuts={false}
/>
```

The available toolbar options are `code`, `lists`, `colors`, `links`, `tables`, `advanced`, and `formats`. Boolean options default to enabled. Use `toolbar` or `surfaceControls` to replace those areas with your own React elements. Pass `null` to remove a slot. Use `history={false}` to skip the built-in history plugin when supplying your own.

Use `contentClassName` to style the editable element, `theme` for Lexical node class names, and `htmlConfig` to extend or override HTML import and export conversions. Composer configuration, including node registration and theme, is applied at mount. Import the packaged CSS for the default appearance, or supply your own styles.

## Build a smaller editor

Import from `react-rich-text-toolkit/core` when you want to choose the document model and editing tools yourself. This entry includes the editing surface, HTML and JSON state APIs, and optional history. Its module graph excludes the built-in toolbar, table and image controls, and Prism. Add Lexical plugins as children and register the corresponding nodes through `nodes`. Keep directly installed Lexical packages aligned with the version used by this package.

```tsx
import { EditorCore } from 'react-rich-text-toolkit/core'
import 'react-rich-text-toolkit/editor.css'

export function CommentEditor() {
    return <EditorCore label="Comment" placeholder="Write a comment…" />
}
```

For an editor that also needs syntax-highlighted code, add the code module explicitly.

```tsx
import { EditorCore } from 'react-rich-text-toolkit/core'
import { CodeEditingPlugin, CodeLanguagePicker, codeNodes } from 'react-rich-text-toolkit/code'
import 'react-rich-text-toolkit/editor.css'

export function SnippetEditor() {
    return (
        <EditorCore label="Snippet" nodes={codeNodes} surfaceControls={<CodeLanguagePicker />}>
            <CodeEditingPlugin />
        </EditorCore>
    )
}
```

Type three backticks to create a block in this example. Any custom toolbar or plugin rendered inside `EditorCore` can use Lexical's composer context. Select the nodes and plugins before mounting the editor, and register the same document node types when restoring JSON.

### Add a custom toolbar

Toolbar elements render inside Lexical's composer. They can dispatch commands using `useLexicalComposerContext`. If your app imports Lexical directly, install versions matching the editor package. This release uses Lexical 0.17.1.

```tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { FORMAT_TEXT_COMMAND } from 'lexical'
import { EditorCore } from 'react-rich-text-toolkit/core'
import 'react-rich-text-toolkit/editor.css'

function BoldControl() {
    const [editor] = useLexicalComposerContext()

    return (
        <button
            type="button"
            onMouseDown={event => event.preventDefault()}
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        >
            Bold
        </button>
    )
}

export function CustomEditor() {
    return <EditorCore label="Notes" toolbar={<BoldControl />} />
}
```

The mouse handler keeps the selection in the document when the button is clicked. Use the same composer context for plugin children that need to register commands or listen for updates.

## Editing tools

- Paragraphs, six heading levels, quotes, inline code, and language-aware code blocks with syntax highlighting.
- Bold, italic, underline, strikethrough, highlight, subscript, superscript, foreground and background colors, font family and size, line height, and clear formatting.
- Alignment, text direction, indentation, bullets, numbered lists, and interactive checklists.
- Links, editable tables, horizontal dividers, searchable emoji and symbols, and images from HTTPS URLs with editable alt text.
- Undo and redo, Markdown typing shortcuts, and case-insensitive find and replace within text runs.

## Code shortcuts

- Type a backtick, the code, and another backtick (for example, `` `value` ``). A lone backtick or an empty pair stays literal.
- Type three backticks in an empty paragraph to open a code block immediately. Type three backticks on an empty line at the end of the block to return to prose.
- Choose **Code language** in the top-right corner of the block you are editing. Plain text starts without highlighting. Grammars include JavaScript, TypeScript, YAML, Java, Python, Go, C, C++, C#, Rust, HTML, CSS, JSON, SQL, and Bash.

## Upload images

Pass `uploadImage` to enable the file picker in **More tools → Image**, image file drops, and image-only clipboard pastes. The callback receives a `File` and an abort signal. Return an absolute HTTPS URL that your application can use when it reopens the document. The editor saves that URL and the image's alt text in HTML and Lexical JSON.

```tsx
import { RichTextEditor, type UploadImage } from 'react-rich-text-toolkit'

const uploadImage: UploadImage = async (file, { signal }) => {
    const body = new FormData()
    body.append('image', file)
    const response = await fetch('/api/images', { method: 'POST', body, signal })
    if (!response.ok) throw new Error('Image upload failed')
    const result: { url: string } = await response.json()
    return result.url
}

export function ArticleEditor() {
    return <RichTextEditor label="Article" uploadImage={uploadImage} />
}
```

Implement the upload endpoint in your application. The editor announces progress and failures, and aborts pending uploads when it unmounts, becomes read-only, or replaces the document from a prop. Rich HTML pasted from another application keeps the structure supported by the registered Lexical nodes. Clipboard HTML with embedded local images may require inserting those images separately.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Toolbar and document appear unstyled | Load `react-rich-text-toolkit/editor.css` once in your application. |
| Typing feels delayed in a controlled editor | Feed the new HTML back into `value` immediately. Debounce the request that saves it. |
| Changing `defaultValue` or `defaultState` does not update the document | These props initialize an editor. Change its React `key` when switching documents, or use controlled HTML for external replacements. |
| A format changes after reopening HTML | Save Lexical JSON for editable round trips. HTML conversion depends on the registered nodes and converters. |
| Lexical reports an unknown node when restoring JSON | Register the nodes that produced the saved document. For example, include `codeNodes` when restoring code blocks into `EditorCore`. |
| An upload completes without inserting an image | Confirm that the callback returns an absolute HTTPS URL and that the same document is still open and editable. |

The package uses the browser DOM. React Native apps need a WebView integration.

## Run the demo from source

```sh
yarn install
yarn dev
```

## Verify

```sh
yarn build
yarn lint
yarn test
yarn build:lib
```

## Release

Use `npm pack --dry-run` to inspect what npm will publish. For a local install test, run `npm pack` and install the resulting archive in a separate React project. The pack step builds the library automatically with Yarn.

Before the first public release, choose a license and sign in to npm with the publishing account. Run `npm publish` from this directory to publish the configured version.

### Publish automatically from GitHub

Create a GitHub repository and push the project to its `main` branch. The included workflow runs lint, tests, the demo build, and an npm package dry run on every push to `main`, including PR merges.

1. Set `repository.url` in `package.json` to the GitHub repository URL so npm provenance can match the package to its source. Choose a license and publish the first version manually if the package is new.
2. In the package settings on npm, add a GitHub Actions trusted publisher. Enter the GitHub owner and repository name, set the workflow filename to `publish.yml`, and allow direct `npm publish`. Leave the environment field empty.
3. In GitHub, open **Settings → Secrets and variables → Actions → Variables** and set `NPM_PUBLISH_ENABLED` to `true`. From the **Actions** tab, you can run **Publish to npm** on `main` to verify the setup.

Each eligible run increments the patch number from the npm `latest` version. For example, `0.1.0` becomes `0.1.1`. The version change happens on the runner, and npm records the release version. The workflow skips a commit already associated with the latest release and skips outdated runs when newer commits reach `main`. Several rapid merges can therefore ship together in one release.

See the [npm trusted publishing guide](https://docs.npmjs.com/trusted-publishers/) for the account setup.
