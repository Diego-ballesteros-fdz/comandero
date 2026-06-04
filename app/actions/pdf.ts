'use server'

import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import type { ItemComanda } from '@/types/comanda'

export type PdfResult =
  | { ok: true; base64: string; filename: string }
  | { ok: false; error: string }

// ─── Page / column constants (80 mm thermal receipt) ────────────────────────
const PW       = 227   // page width  (80 mm → 226.77 pt)
const PH_BASE  = 175   // fixed overhead: title + date + headers + totals + footer
const MARGIN   = 14
const FS_TITLE = 13
const FS_HEAD  = 7
const FS_BODY  = 8
const LINE_H   = 15    // height per item row
const PASE_H   = 22    // height per pase divider block

// Column right edges (content starts at MARGIN = 14)
//   Name:    14 … 130  (116 pt)
//   Qty:     131 … 155 (right-aligned inside 24 pt zone)
//   Amount:  156 … 213 (right-aligned, right edge = PW - MARGIN)
const COL_QTY_R   = 155          // right edge of quantity column
const COL_PRICE_R = PW - MARGIN  // right edge of price column  = 213

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapText(text: string, maxW: number, font: PDFFont, size: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxW && cur) {
      lines.push(cur)
      cur = word
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function estimatePageHeight(items: ItemComanda[], comentario: string): number {
  const platoRows = items.filter((i) => i.kind === 'plato').length
  const paseRows  = items.filter((i) => i.kind === 'pase').length
  // Estimate comment lines: ~35 chars per line at FS_BODY on 199 pt content width
  const commentLines = comentario.trim()
    ? Math.ceil(comentario.trim().length / 35) + 1
    : 0
  const commentH = comentario.trim() ? 14 + commentLines * LINE_H + 4 : 0
  return PH_BASE + platoRows * LINE_H + paseRows * PASE_H + commentH
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

async function buildPDF(items: ItemComanda[], comentario: string): Promise<Uint8Array> {
  const PAGE_H = estimatePageHeight(items, comentario)

  const doc     = await PDFDocument.create()
  const page    = doc.addPage([PW, PAGE_H])
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = PAGE_H - MARGIN

  // ── Draw helpers ──────────────────────────────────────────────────────────

  function txt(
    content: string,
    x: number,
    yPos: number,
    size: number,
    font: PDFFont = regular,
    color = rgb(0, 0, 0)
  ) {
    page.drawText(content, { x, y: yPos, size, font, color })
  }

  /** Right-align text so its right edge lands at `rightEdge`. */
  function txtR(
    content: string,
    rightEdge: number,
    yPos: number,
    size: number,
    font: PDFFont = regular
  ) {
    txt(content, rightEdge - font.widthOfTextAtSize(content, size), yPos, size, font)
  }

  /** Center text horizontally on the page. */
  function txtC(content: string, yPos: number, size: number, font: PDFFont = regular, color = rgb(0, 0, 0)) {
    txt(content, (PW - font.widthOfTextAtSize(content, size)) / 2, yPos, size, font, color)
  }

  function solidLine(yPos: number) {
    page.drawLine({
      start: { x: MARGIN, y: yPos }, end: { x: PW - MARGIN, y: yPos },
      thickness: 0.8, color: rgb(0.15, 0.15, 0.15),
    })
  }

  function dashedLine(yPos: number) {
    page.drawLine({
      start: { x: MARGIN, y: yPos }, end: { x: PW - MARGIN, y: yPos },
      thickness: 0.4, color: rgb(0.65, 0.65, 0.65), dashArray: [2, 3],
    })
  }

  // ── Title ─────────────────────────────────────────────────────────────────
  txtC('COMANDA', y, FS_TITLE, bold)
  y -= 18

  // ── Date / time ───────────────────────────────────────────────────────────
  const now = new Date()
  const dateStr =
    now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    '   ' +
    now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  txtC(dateStr, y, FS_HEAD, regular, rgb(0.5, 0.5, 0.5))
  y -= 12

  solidLine(y);  y -= 10

  // ── Column headers ────────────────────────────────────────────────────────
  txt('PLATO',    MARGIN,    y, FS_HEAD, bold)
  txtR('UD',      COL_QTY_R,   y, FS_HEAD, bold)
  txtR('IMPORTE', COL_PRICE_R, y, FS_HEAD, bold)
  y -= 5
  dashedLine(y);  y -= LINE_H

  // ── Items + pase dividers ─────────────────────────────────────────────────
  let subtotal = 0

  for (const item of items) {
    if (item.kind === 'pase') {
      // Pase divider block
      y -= 4
      dashedLine(y);  y -= 9
      txtC(`— ${item.label} —`, y, FS_HEAD, bold, rgb(0.35, 0.35, 0.35))
      y -= 9
      dashedLine(y);  y -= LINE_H - 5
      continue
    }

    // Regular plato row
    const amount = item.plato.precio * item.cantidad
    subtotal += amount

    const maxChars = 22
    const nombre =
      item.plato.nombre.length > maxChars
        ? item.plato.nombre.slice(0, maxChars - 1) + '.'
        : item.plato.nombre

    txt(`${item.cantidad}x`, MARGIN, y, FS_BODY, regular, rgb(0.45, 0.45, 0.45))
    txt(nombre, MARGIN + 14, y, FS_BODY)
    txtR(`${amount.toFixed(2)}`, COL_PRICE_R, y, FS_BODY)

    y -= LINE_H
  }

  // ── Totals block ──────────────────────────────────────────────────────────
  y -= 4
  solidLine(y);  y -= 13

  const iva   = subtotal * 0.21
  const total = subtotal + iva

  txt('Subtotal',     MARGIN, y, FS_HEAD, regular, rgb(0.4, 0.4, 0.4))
  txtR(`${subtotal.toFixed(2)} EUR`, COL_PRICE_R, y, FS_HEAD, regular)
  y -= LINE_H - 2

  txt('IVA (21%)',    MARGIN, y, FS_HEAD, regular, rgb(0.4, 0.4, 0.4))
  txtR(`${iva.toFixed(2)} EUR`, COL_PRICE_R, y, FS_HEAD, regular)
  y -= 5
  dashedLine(y);  y -= 12

  txt('TOTAL',        MARGIN, y, FS_BODY, bold)
  txtR(`${total.toFixed(2)} EUR`, COL_PRICE_R, y, 10, bold)
  y -= 18

  // ── Comment ───────────────────────────────────────────────────────────────
  if (comentario.trim()) {
    dashedLine(y);  y -= 12
    txt('Nota:', MARGIN, y, FS_HEAD, bold)
    y -= LINE_H - 2

    const CW = PW - MARGIN * 2
    const lines = wrapText(comentario.trim(), CW, regular, FS_BODY)
    for (const line of lines) {
      txt(line, MARGIN, y, FS_BODY, regular, rgb(0.25, 0.25, 0.25))
      y -= LINE_H
    }
  }

  return doc.save()
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function generarComandaPDF(
  items: ItemComanda[],
  comentario: string
): Promise<PdfResult> {
  try {
    const hasPlatos = items.some((i) => i.kind === 'plato')
    if (!hasPlatos) return { ok: false, error: 'La comanda no tiene platos.' }

    const pdfBytes = await buildPDF(items, comentario)
    const base64 = Buffer.from(pdfBytes).toString('base64')
    const filename = `comanda-${Date.now()}.pdf`

    return { ok: true, base64, filename }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
