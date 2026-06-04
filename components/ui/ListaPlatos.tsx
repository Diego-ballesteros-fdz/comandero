'use client'

import { Plus, Minus, UtensilsCrossed, Layers } from 'lucide-react'
import type { Plato } from '@/lib/platos'
import { useComanda } from '@/lib/comanda-context'

export function ListaPlatos({ platos }: { platos: Plato[] }) {
  const { items, addPlato, removeItem, addPase } = useComanda()

  function getCantidad(id: number) {
    const item = items.find((i) => i.kind === 'plato' && i.plato.id === id)
    return item?.kind === 'plato' ? item.cantidad : 0
  }

  const platosActivos = platos.filter((p) => p.activo)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-zinc-400" />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Platos disponibles
          </h1>
        </div>
        <button
          onClick={addPase}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-300 font-medium transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          Añadir pase
        </button>
      </div>

      {platosActivos.length === 0 ? (
        <p className="text-sm text-zinc-400">No hay platos activos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platosActivos.map((plato) => {
            const cantidad = getCantidad(plato.id)
            const seleccionado = cantidad > 0

            return (
              <div
                key={plato.id}
                className={`rounded-xl border p-4 bg-white dark:bg-zinc-900 transition-all ${
                  seleccionado
                    ? 'border-zinc-900 dark:border-zinc-100 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {plato.nombre}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">{plato.precio.toFixed(2)} €</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {seleccionado && (
                      <>
                        <button
                          onClick={() => removeItem(plato.id)}
                          className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                          aria-label="Quitar uno"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {cantidad}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => addPlato(plato)}
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 transition-colors"
                      aria-label="Añadir"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
