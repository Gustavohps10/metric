import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'

export function packageAddon(
  pathsToInclude: string | string[],
  outFile: string,
) {
  const zip = new AdmZip()
  const items = Array.isArray(pathsToInclude)
    ? pathsToInclude
    : [pathsToInclude]

  items.forEach((item) => {
    const stats = fs.statSync(item)
    stats.isDirectory()
      ? zip.addLocalFolder(item, path.basename(item))
      : zip.addLocalFile(item)
  })

  zip.writeZip(outFile)
}
