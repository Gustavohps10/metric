import fs from 'fs'
import path from 'path'

export interface PackageJson {
  name?: string
  author?: string
  description?: string
  version?: string
  repository?: { url?: string }
}

export interface PackageJsonData extends PackageJson {
  sanitizedName?: string
  defaultVersion?: string
  defaultAuthor?: string
  defaultDescription?: string
  defaultSourceUrl?: string
}

function sanitizeAddonId(name: string | undefined) {
  return (name || '').replace(/[^a-zA-Z0-9-_]/g, '')
}

export function readPackageJson(addonDir: string): PackageJsonData {
  const pkgPath = path.join(addonDir, 'package.json')
  if (!fs.existsSync(pkgPath)) return {}

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as PackageJson
    return {
      ...pkg,
      sanitizedName: sanitizeAddonId(pkg.name),
      defaultVersion: pkg.version,
      defaultAuthor: pkg.author,
      defaultDescription: pkg.description,
      defaultSourceUrl: pkg.repository?.url,
    }
  } catch {
    console.warn(`⚠️ Could not read package.json from ${pkgPath}`)
    return {}
  }
}
