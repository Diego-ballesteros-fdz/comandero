'use client'

import { useState, useTransition } from 'react'
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import type { Plato } from '@/lib/platos'
import {
  actionAddPlato,
  actionUpdatePlato,
  actionDeletePlato,
  actionToggleActivo,
} from '@/app/gestion/actions'

export function GestionPlatos({ platos }: { platos: Plato[] }) {
  const [editId, setEditId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editPrecio, setEditPrecio] = useState('')
  const [isPending, startTransition] = useTransition()

  function startEdit(plato: Plato) {
    setEditId(plato.id)
    setEditNombre(plato.nombre)
    setEditPrecio(plato.precio.toFixed(2))
  }

  function cancelEdit() {
    setEditId(null)
  }

  function saveEdit() {
    if (editId === null) return
    const precio = parseFloat(editPrecio)
    if (!editNombre.trim() || isNaN(precio) || precio < 0) return
    startTransition(async () => {
      await actionUpdatePlato(editId, editNombre.trim(), precio)
      setEditId(null)
    })
  }

  function handleDelete(id: number) {
    startTransition(() => actionDeletePlato(id))
  }

  function handleToggle(id: number, activo: boolean) {
    startTransition(() => actionToggleActivo(id, !activo))
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-zinc-400" />
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Gestión de platos
        </h1>
      </div>

      {/* Formulario añadir */}
      <form
        action={actionAddPlato}
        className="flex flex-col sm:flex-row gap-2 mb-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <input
          name="nombre"
          placeholder="Nombre del plato"
          required
          className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        />
        <input
          name="precio"
          type="number"
          step="0.01"
          min="0"
          placeholder="Precio (€)"
          required
          className="sm:w-32 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir
        </button>
      </form>

      {/* Lista de platos */}
      <div className="flex flex-col gap-2">
        {platos.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay platos en el sistema.</p>
        ) : (
          platos.map((plato) =>
            editId === plato.id ? (
              /* Modo edición inline */
              <div
                key={plato.id}
                className="flex items-center gap-2 rounded-xl border border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 px-4 py-3"
              >
                <input
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  autoFocus
                  className="flex-1 px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
                <input
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-24 px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={saveEdit}
                    disabled={isPending}
                    aria-label="Guardar"
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    aria-label="Cancelar"
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Modo vista */
              <div
                key={plato.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3"
              >
                <button
                  onClick={() => handleToggle(plato.id, plato.activo)}
                  disabled={isPending}
                  aria-label={plato.activo ? 'Desactivar' : 'Activar'}
                  className="shrink-0 transition-opacity disabled:opacity-50"
                >
                  {plato.activo ? (
                    <ToggleRight className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-zinc-400" />
                  )}
                </button>

                <span
                  className={`flex-1 text-sm font-medium truncate ${
                    plato.activo
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-400 line-through'
                  }`}
                >
                  {plato.nombre}
                </span>

                <span className="text-sm text-zinc-400 shrink-0">
                  {plato.precio.toFixed(2)} €
                </span>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(plato)}
                    aria-label="Editar"
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(plato.id)}
                    disabled={isPending}
                    aria-label="Eliminar"
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-900/30 text-zinc-600 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}
