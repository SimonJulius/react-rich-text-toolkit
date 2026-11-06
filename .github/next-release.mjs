import { readFileSync } from 'node:fs'

const { name } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`
const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })

if (!response.ok) {
    throw new Error(`npm returned HTTP ${response.status} for ${name}. Publish the first release and configure its trusted publisher before enabling automation.`)
}

const { version, gitHead } = await response.json()
if (gitHead && gitHead === process.env.GITHUB_SHA) {
    console.error(`${name}@${version} already contains this commit.`)
} else {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
    if (!match) throw new Error(`Expected a stable npm latest version, received ${version}.`)
    const [, major, minor, patch] = match
    console.log(`${major}.${minor}.${BigInt(patch) + 1n}`)
}
