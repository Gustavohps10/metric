import fs from 'fs'
import path from 'path'

import { readYaml, writeYaml } from '../utils/yaml'
import { packageAddon } from '../utils/zip'

interface InstallerManifest {
  AddonId: string
  Packages: {
    Version: string
    RequiredApiVersion: string
    ReleaseDate: string
    DownloadUrl: string
    Changelog?: string[]
  }[]
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9-_.]/g, '')
}

export function buildAddon(
  distDir: string,
  options: { apiVersion: string; downloadUrl?: string; changelog?: string[] },
) {
  const rootDir = path.resolve(distDir, '..')
  const manifestPath = path.join(rootDir, 'manifest.yaml')
  const installerPath = path.join(rootDir, 'installer.yaml')
  const packageJsonPath = path.join(rootDir, 'package.json')

  if (!fs.existsSync(distDir))
    throw new Error(`Dist folder not found: ${distDir}`)
  const manifest = readYaml(manifestPath) as {
    AddonId: string
    Version: string
  }

  const outFile = sanitizeFileName(
    `${manifest.AddonId}-${manifest.Version}.tladdon`,
  )

  let installer: InstallerManifest = fs.existsSync(installerPath)
    ? (readYaml(installerPath) as InstallerManifest)
    : { AddonId: manifest.AddonId, Packages: [] }

  const newPackage = {
    Version: manifest.Version,
    RequiredApiVersion: options.apiVersion,
    ReleaseDate: new Date().toISOString().split('T')[0],
    DownloadUrl: options.downloadUrl || '',
    Changelog: options.changelog || [],
  }

  installer.Packages = installer.Packages.filter(
    (p) => p.Version !== manifest.Version,
  )
  installer.Packages.unshift(newPackage)

  writeYaml(installerPath, installer)

  const filesToInclude: string[] = []

  fs.readdirSync(distDir).forEach((file) =>
    filesToInclude.push(path.join(distDir, file)),
  )
  ;[manifestPath, installerPath, packageJsonPath].forEach((file) =>
    fs.existsSync(file)
      ? filesToInclude.push(file)
      : () => {
          throw new Error(`File not found: ${distDir}`)
        },
  )
  packageAddon(filesToInclude, outFile)

  console.log(`📦 Addon packaged in: ${outFile}`)
  console.log(`✅ Installer manifest updated: ${installerPath}`)
}
