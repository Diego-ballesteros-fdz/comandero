'use client'

import { createContext, useContext, useState } from 'react'
import type { Plato } from './platos'
import type { ItemComanda } from '@/types/comanda'

export type { ItemComanda }

type ComandaCtx = {
  items: ItemComanda[]
  comentario: string
  addPlato: (plato: Plato) => void
  removeItem: (platoId: number) => void
  addPase: () => void
  removePase: (id: string) => void
  setComentario: (c: string) => void
  clearComanda: () => void
}

const ComandaContext = createContext<ComandaCtx | null>(null)

export function ComandaProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemComanda[]>([])
  const [comentario, setComentario] = useState('')

  function addPlato(plato: Plato) {
    setItems((prev) => {
      const found = prev.find((i) => i.kind === 'plato' && i.plato.id === plato.id)
      if (found) {
        return prev.map((i) =>
          i.kind === 'plato' && i.plato.id === plato.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [...prev, { kind: 'plato', plato, cantidad: 1 }]
    })
  }

  function removeItem(platoId: number) {
    setItems((prev) => {
      const found = prev.find((i) => i.kind === 'plato' && i.plato.id === platoId)
      if (!found || found.kind !== 'plato') return prev
      if (found.cantidad === 1) {
        return prev.filter((i) => !(i.kind === 'plato' && i.plato.id === platoId))
      }
      return prev.map((i) =>
        i.kind === 'plato' && i.plato.id === platoId
          ? { ...i, cantidad: i.cantidad - 1 }
          : i
      )
    })
  }

  function addPase() {
    setItems((prev) => {
      const n = prev.filter((i) => i.kind === 'pase').length + 1
      return [...prev, { kind: 'pase', label: `PASE ${n}`, id: `pase-${Date.now()}` }]
    })
  }

  function removePase(id: string) {
    setItems((prev) => prev.filter((i) => !(i.kind === 'pase' && i.id === id)))
  }

  function clearComanda() {
    setItems([])
    setComentario('')
  }

  return (
    <ComandaContext.Provider
      value={{ items, comentario, addPlato, removeItem, addPase, removePase, setComentario, clearComanda }}
    >
      {children}
    </ComandaContext.Provider>
  )
}

export function useComanda() {
  const ctx = useContext(ComandaContext)
  if (!ctx) throw new Error('useComanda debe usarse dentro de ComandaProvider')
  return ctx
}
