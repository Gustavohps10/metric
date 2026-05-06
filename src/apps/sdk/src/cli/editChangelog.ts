import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

export function editChangelog(initialContent = ''): string[] {
  const tmpFile = path.join(os.tmpdir(), `CHANGELOG_${Date.now()}.txt`)
  fs.writeFileSync(tmpFile, initialContent)

  const editor =
    process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi')
  spawnSync(editor, [tmpFile], { stdio: 'inherit' })

  const content = fs.readFileSync(tmpFile, 'utf-8')
  fs.unlinkSync(tmpFile)

  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}
