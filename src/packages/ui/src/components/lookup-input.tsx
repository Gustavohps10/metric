import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib'

type LookupSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg'

interface LookupInputProps {
  value: string
  onChange: (value: string) => void
  onOpenLookup: () => void
  placeholder?: string
  disabled?: boolean
  size?: LookupSize
}

export function LookupInput({
  value,
  onChange,
  onOpenLookup,
  placeholder,
  disabled,
  size = 'md',
}: LookupInputProps) {
  const sizeConfig = {
    '2xs': {
      input: 'h-6 text-[10px] px-1.5 pr-12',
      button: 'h-4 w-4',
      icon: 'h-2.5 w-2.5',
      container: 'gap-0.5 right-0.5',
    },
    xs: {
      input: 'h-7 text-[11px] px-2 pr-14',
      button: 'h-5 w-5',
      icon: 'h-3 w-3',
      container: 'gap-0.5 right-1',
    },
    sm: {
      input: 'h-8 text-xs px-2.5 pr-16',
      button: 'h-6 w-6',
      icon: 'h-3.5 w-3.5',
      container: 'gap-0.5 right-1',
    },
    md: {
      input: 'h-9 text-sm px-3 pr-20',
      button: 'h-7 w-7',
      icon: 'h-4 w-4',
      container: 'gap-1 right-1.5',
    },
    lg: {
      input: 'h-10 text-base px-3.5 pr-24',
      button: 'h-8 w-8',
      icon: 'h-[18px] w-[18px]',
      container: 'gap-1.5 right-2',
    },
  }[size]

  return (
    <div className="relative w-full">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('font-mono transition-all', sizeConfig.input)}
      />

      <div
        className={cn(
          'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center',
          sizeConfig.container,
        )}
      >
        {value && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onChange('')}
            className={cn(
              'pointer-events-auto shrink-0 p-0',
              sizeConfig.button,
            )}
          >
            <X className={sizeConfig.icon} />
          </Button>
        )}

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onOpenLookup}
          disabled={disabled}
          className={cn('pointer-events-auto shrink-0 p-0', sizeConfig.button)}
        >
          <Search className={sizeConfig.icon} />
        </Button>
      </div>
    </div>
  )
}
