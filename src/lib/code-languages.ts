// Initialize Prism before loading grammars, including when the package is imported in Node.
import 'prismjs'
import 'prismjs/components/prism-clike.js'
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-csharp.js'
import 'prismjs/components/prism-diff.js'
import 'prismjs/components/prism-docker.js'
import 'prismjs/components/prism-go.js'
import 'prismjs/components/prism-json.js'
import 'prismjs/components/prism-ruby.js'
import 'prismjs/components/prism-toml.js'
import 'prismjs/components/prism-yaml.js'

export const codeLanguages = [
    { value: 'plain', label: 'Plain text', aliases: ['text', 'plaintext', 'txt'] },
    { value: 'javascript', label: 'JavaScript', aliases: ['js'] },
    { value: 'typescript', label: 'TypeScript', aliases: ['ts'] },
    { value: 'yaml', label: 'YAML / YML', aliases: ['yml'] },
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python', aliases: ['py'] },
    { value: 'go', label: 'Go', aliases: ['golang'] },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++', aliases: ['c++'] },
    { value: 'csharp', label: 'C#', aliases: ['cs', 'c#', 'dotnet'] },
    { value: 'rust', label: 'Rust', aliases: ['rs'] },
    { value: 'html', label: 'HTML', aliases: ['markup'] },
    { value: 'css', label: 'CSS' },
    { value: 'xml', label: 'XML' },
    { value: 'json', label: 'JSON', aliases: ['webmanifest'] },
    { value: 'bash', label: 'Bash / Shell', aliases: ['sh', 'shell'] },
    { value: 'sql', label: 'SQL' },
    { value: 'markdown', label: 'Markdown', aliases: ['md'] },
    { value: 'ruby', label: 'Ruby', aliases: ['rb'] },
    { value: 'swift', label: 'Swift' },
    { value: 'objectivec', label: 'Objective-C', aliases: ['objc'] },
    { value: 'powershell', label: 'PowerShell' },
    { value: 'docker', label: 'Dockerfile', aliases: ['dockerfile'] },
    { value: 'toml', label: 'TOML' },
    { value: 'diff', label: 'Diff' },
]

export function resolveCodeLanguage(language?: string | null): string {
    const key = language?.toLowerCase() || 'plain'
    return codeLanguages.find(({ value, aliases }) => value === key || aliases?.includes(key))?.value ?? key
}
