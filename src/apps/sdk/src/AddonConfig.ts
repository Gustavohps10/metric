export type AddonConfig = {
  AddonId?: string
  Type?: 'Generic' | 'DataSource' | 'Theme'
  Name?: string
  Author?: string
  ShortDescription?: string
  Description?: string
  Tags?: string[]
  SourceUrl?: string
  IconUrl?: string
}
