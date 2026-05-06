import inquirer from 'inquirer'
import path from 'path'

import { writeYaml } from '../utils/yaml'

function sanitizeAddonId(addonId: string) {
  return addonId.replace(/[^a-zA-Z0-9-_]/g, '')
}

export async function runManifestWizard(addonDir: string, options: any) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'AddonId',
      message: 'Addon ID:',
      default: options.defaultAddonId || path.basename(addonDir),
      filter: sanitizeAddonId,
    },
    {
      type: 'input',
      name: 'Version',
      message: 'Addon Version:',
      default: options.defaultVersion || '1.0.0',
    },
    {
      type: 'list',
      name: 'Type',
      message: 'Addon Type:',
      choices: ['Generic', 'DataSource', 'Theme'],
      default: options.type || 'Generic',
    },
    {
      type: 'input',
      name: 'Name',
      message: 'Addon Name:',
      default: options.defaultName || path.basename(addonDir),
    },
    {
      type: 'input',
      name: 'Author',
      message: 'Author:',
      default: options.defaultAuthor || '',
    },
    {
      type: 'input',
      name: 'ShortDescription',
      message: 'Short Description:',
      default: options.defaultShortDescription || '',
    },
    {
      type: 'input',
      name: 'Description',
      message: 'Full Description:',
      default: options.defaultDescription || '',
    },
    {
      type: 'input',
      name: 'Tags',
      message: 'Tags (comma separated):',
      default: options.defaultTags?.join(',') || '',
      filter: (input: string) => input.split(',').map((t) => t.trim()),
    },
    {
      type: 'input',
      name: 'SourceUrl',
      message: 'Source code URL (optional):',
      default: options.defaultSourceUrl || '',
    },
    {
      type: 'input',
      name: 'IconUrl',
      message: 'Icon URL (optional):',
      default: options.defaultIconUrl || '',
    },
    {
      type: 'input',
      name: 'InstallerUrl',
      message: 'Installer remote URL (optional):',
      default: options.defaultInstallerUrl || '',
    },
  ])

  const manifestPath = path.join(addonDir, 'manifest.yaml')
  writeYaml(manifestPath, answers)
  console.log(`✅ Manifest updated: ${manifestPath}`)
}
