import { program } from 'commander'
import fs from 'fs'
import inquirer from 'inquirer'

import { readPackageJson } from '../utils/packageJsonData'
import { editChangelog } from './editChangelog'
import { runManifestWizard } from './manifest'
import { buildAddon } from './pkg'

program
  .name('metric')
  .description('CLI to create and package .tladdon addons')
  .version(__SDK_VERSION__)

function readConfig(file?: string) {
  if (!file) return {}
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    console.warn('⚠️ Could not read config file, ignoring')
    return {}
  }
}

program
  .command('manifest <addonDir>')
  .description('Create or update addon manifest.yaml')
  .option('--generic', 'Set type as Generic')
  .option('--datasource', 'Set type as DataSource')
  .option('--theme', 'Set type as Theme')
  .option('--config <file>', 'Path to metric.json with default config')
  .action(async (addonDir, options) => {
    const pkg = readPackageJson(addonDir)
    const configDefaults = readConfig(options.config)

    await runManifestWizard(addonDir, {
      type: options.generic
        ? 'Generic'
        : options.datasource
          ? 'DataSource'
          : options.theme
            ? 'Theme'
            : configDefaults.Type || 'Generic',
      defaultVersion: pkg.version,
      defaultName: configDefaults.Name || pkg.name,
      defaultAuthor: configDefaults.Author || pkg.author,
      defaultDescription: configDefaults.Description || pkg.description,
      defaultShortDescription: configDefaults.ShortDescription || '',
      defaultTags: configDefaults.Tags || [],
      defaultSourceUrl: configDefaults.SourceUrl || pkg.repository?.url || '',
      defaultIconUrl: configDefaults.IconUrl || '',
      defaultAddonId: configDefaults.AddonId || pkg.name,
      defaultInstallerUrl: configDefaults.InstallerUrl || '',
    })
  })

program
  .command('pkg <addonDir>')
  .description('Package addon into .tladdon and update installer.yaml')
  .option('--download-url <url>', 'Public URL to download this addon version')
  .option('--changelog <items...>', 'List of changes for this version')
  .option('--config <file>', 'Path to metric.json with default config')
  .action(async (addonDir, options) => {
    const configDefaults = readConfig(options.config)
    let downloadUrl = options.downloadUrl || configDefaults.downloadUrl

    if (!downloadUrl) {
      const answer = await inquirer.prompt({
        type: 'input',
        name: 'downloadUrl',
        message: 'Public URL to download this addon version:',
        default: configDefaults.downloadUrl || '',
      })
      downloadUrl = answer.downloadUrl
    }

    const changelog = editChangelog(
      configDefaults.changelog || '- Initial release\n',
    )

    buildAddon(addonDir, {
      apiVersion: __SDK_VERSION__,
      downloadUrl,
      changelog,
    })
  })

program.parse(process.argv)
