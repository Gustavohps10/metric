import fs from 'fs'
import yaml from 'js-yaml'

export function writeYaml(file: string, content: object) {
  const yamlStr = yaml.dump(content)
  fs.writeFileSync(file, yamlStr, 'utf-8')
}

export function readYaml(file: string) {
  if (!fs.existsSync(file)) return {}
  return yaml.load(fs.readFileSync(file, 'utf-8'))
}
