import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { RichTextEditor } from '../index'
import { Button } from './ui/button'

const initialContent = '<h1>Project notes</h1><p>Use the toolbar to format this document, add a link, or insert a table.</p>'

export default function CustomForm() {
    const form = useForm({ defaultValues: { content: initialContent } })
    const [readOnly, setReadOnly] = useState(false)
    const [submitted, setSubmitted] = useState<string>()

    return (
        <main className="w-full min-w-0 px-3 py-5 sm:px-6 sm:py-8">
            <header className="mb-6">
                <p className="mb-2 text-sm font-semibold text-blue-700">Editor demo</p>
                <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">Rich text editor</h1>
                <p id="editor-hint" className="mt-2 text-sm text-slate-600">
                    Format a document, then submit the form to inspect its HTML.
                </p>
            </header>
            <form className="min-w-0 space-y-4" onSubmit={form.handleSubmit(({ content }) => setSubmitted(content))}>
                <Controller name="content" control={form.control} render={({ field }) =>
                    <RichTextEditor
                        id="demo-editor"
                        label="Document content"
                        describedBy="editor-hint"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        readOnly={readOnly}
                        ref={handle => field.ref(handle)}
                    />
                } />
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    <Button className="h-auto min-h-11 whitespace-normal px-2 sm:px-4" type="submit">Submit</Button>
                    <Button className="h-auto min-h-11 whitespace-normal px-2 sm:px-4" type="button" variant="outline" onClick={() => form.reset({ content: '' })}>Clear document</Button>
                    <Button className="h-auto min-h-11 whitespace-normal px-2 sm:px-4" type="button" variant="outline" onClick={() => form.reset({ content: initialContent })}>Restore sample</Button>
                    <label className="inline-flex min-h-11 items-center gap-2 px-2 text-sm sm:ml-auto">
                        <input type="checkbox" checked={readOnly} onChange={event => setReadOnly(event.target.checked)} />
                        Read-only
                    </label>
                </div>
            </form>
            {submitted !== undefined && <section className="mt-6" aria-label="Submission output">
                <h2 className="mb-2 text-sm font-semibold">Submitted HTML</h2>
                <pre className="max-w-full whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-sm [overflow-wrap:anywhere] sm:p-4">{submitted || '(empty)'}</pre>
            </section>}
        </main>
    )
}
