export interface AddonManifestViewModel {
  id: string
  version: string
  name: string
  creator: string
  description: string
  path: string
  logo: string
  downloads: number
  stars: number
  installed: boolean
  installerManifestUrl?: string
  sourceUrl?: string
  tags?: string[]
}
