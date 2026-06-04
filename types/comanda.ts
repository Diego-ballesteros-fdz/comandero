import type { Plato } from '@/lib/platos'

export type ItemComanda =
  | { kind: 'plato'; plato: Plato; cantidad: number }
  | { kind: 'pase'; label: string; id: string }
