'use client'

import { useState, useTransition } from 'react'
import {
  ClipboardList,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react'
import { useComanda } from '@/lib/comanda-context'
import { generarComandaPDF } from '@/app/actions/pdf'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function ResumenComanda() {
  const { items, comentario, addPlato, removeItem, removePase, setComentario, clearComanda } =
    useComanda()
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [resultMsg, setResultMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  const platoItems = items.filter((i) => i.kind === 'plato')
  const totalItems = platoItems.reduce((s, i) => s + (i.kind === 'plato' ? i.cantidad : 0), 0)
  const subtotal = platoItems.reduce(
    (s, i) => s + (i.kind === 'plato' ? i.plato.precio * i.cantidad : 0),
    0
  )
  const iva = subtotal * 0.21
  const total = subtotal + iva

  if (items.length === 0 && status !== 'sent') return null

  function handleEnviar() {
    if (isPending || status === 'sending') return
    setStatus('sending')
    startTransition(async () => {
      const result = await generarComandaPDF(items, comentario)
      if (result.ok) {
        const bytes = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        URL.revokeObjectURL(url)

        setResultMsg(result.filename)
        setStatus('sent')
        setTimeout(() => {
          clearComanda()
          setStatus('idle')
          setExpanded(false)
          setResultMsg('')
        }, 3000)
      } else {
        setResultMsg(result.error)
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      }
    })
  }

  const isSending = status === 'sending' || isPending

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">

        {/* ── Compact header ── */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <ClipboardList className="w-4 h-4 text-zinc-400" />
            <span>
              {totalItems} {totalItems === 1 ? 'plato' : 'platos'}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {/* ── Expandable body ── */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            expanded ? 'max-h-[520px]' : 'max-h-0'
          }`}
        >
          <div className="border-t border-zinc-100 dark:border-zinc-800">

            {/* Feedback banners */}
            {status === 'sent' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">PDF descargado: {resultMsg}</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{resultMsg}</span>
              </div>
            )}

            {/* Items + pase dividers */}
            {items.length > 0 && (
              <div className="overflow-y-auto max-h-52 px-4 py-2 flex flex-col gap-0.5">
                {items.map((item) => {
                  if (item.kind === 'pase') {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 py-1.5"
                      >
                        <div className="flex-1 flex items-center gap-2">
                          <Layers className="w-3 h-3 text-zinc-400 shrink-0" />
                          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                            {item.label}
                          </span>
                          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                        <button
                          onClick={() => removePase(item.id)}
                          className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                          aria-label="Eliminar pase"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div key={item.plato.id} className="flex items-center gap-2 py-1">
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => removeItem(item.plato.id)}
                          className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
                          aria-label="Quitar uno"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-4 text-center text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => addPlato(item.plato)}
                          className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
                          aria-label="Añadir uno"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {item.plato.nombre}
                      </span>
                      <span className="text-sm text-zinc-400 shrink-0 tabular-nums">
                        {(item.plato.precio * item.cantidad).toFixed(2)} €
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Totals breakdown */}
            {platoItems.length > 0 && (
              <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>IVA (21%)</span>
                  <span className="tabular-nums">{iva.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <span>Total</span>
                  <span className="tabular-nums">{total.toFixed(2)} €</span>
                </div>
              </div>
            )}

            {/* Comment */}
            <div className="px-4 pb-3">
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Comentario (opcional)"
                rows={2}
                disabled={isSending}
                className="w-full resize-none px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={handleEnviar}
                disabled={isSending || platoItems.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar comanda
                  </>
                )}
              </button>
              <button
                onClick={() => { clearComanda(); setExpanded(false) }}
                disabled={isSending}
                title="Vaciar comanda"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
