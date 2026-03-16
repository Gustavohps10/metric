'use client'

import {
  Boxes,
  CheckCircle,
  Database,
  Palette,
  Store,
  Wrench,
} from 'lucide-react'

import { cn } from '@/lib/utils'

export type AddonCategory =
  | 'all'
  | 'data-sources'
  | 'utilities'
  | 'themes'
  | 'installed'
  | 'marketplace'

const categories: {
  id: AddonCategory
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'all', label: 'Todos', icon: Boxes },
  { id: 'data-sources', label: 'Fontes de Dados', icon: Database },
  { id: 'utilities', label: 'Utilitários', icon: Wrench },
  { id: 'themes', label: 'Temas', icon: Palette },
  { id: 'installed', label: 'Instalados', icon: CheckCircle },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
]

interface AddonCategorySidebarProps {
  activeCategory: AddonCategory
  onCategoryChange: (category: AddonCategory) => void
  counts?: Partial<Record<AddonCategory, number>>
}

export function AddonCategorySidebar({
  activeCategory,
  onCategoryChange,
  counts,
}: AddonCategorySidebarProps) {
  return (
    <nav className="border-border w-[220px] shrink-0 border-r pr-6">
      <ul className="mx-1 space-y-1">
        {categories.map((category) => {
          const Icon = category.icon
          const isActive = activeCategory === category.id
          const count = counts?.[category.id]

          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </span>
                {count !== undefined && count > 0 && (
                  <span className="text-muted-foreground text-xs">{count}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
