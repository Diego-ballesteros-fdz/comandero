import { promises as fs } from 'fs'
import path from 'path'

export type Plato = {
  id: number
  nombre: string
  precio: number
  activo: boolean
}

const KV_KEY = 'platos'

const SEED: Plato[] = [
  { id: 1, nombre: 'Ensalada César',      precio: 8.5,  activo: true },
  { id: 2, nombre: 'Pasta Carbonara',      precio: 12,   activo: true },
  { id: 3, nombre: 'Chuletón de ternera', precio: 22.5, activo: true },
  { id: 4, nombre: 'Tarta de queso',       precio: 5.5,  activo: true },
  { id: 5, nombre: 'Agua mineral',         precio: 1.5,  activo: true },
  { id: 6, nombre: 'Albondigas',           precio: 10.5, activo: true },
]

const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

// ── File-system helpers (local dev) ──────────────────────────────────────────

const DATA_FILE = path.join(process.cwd(), 'data', 'platos.txt')

function parseLine(line: string): Plato | null {
  const parts = line.split('|')
  if (parts.length !== 4) return null
  const id = parseInt(parts[0])
  const precio = parseFloat(parts[2])
  if (isNaN(id) || isNaN(precio)) return null
  return { id, nombre: parts[1], precio, activo: parts[3].trim() === 'true' }
}

function serializeLine(plato: Plato): string {
  return `${plato.id}|${plato.nombre}|${plato.precio}|${plato.activo}`
}

async function fsGetPlatos(): Promise<Plato[]> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8')
    return content
      .split('\n')
      .filter((l) => l.trim())
      .map(parseLine)
      .filter((p): p is Plato => p !== null)
  } catch {
    return [...SEED]
  }
}

async function fsWritePlatos(platos: Plato[]): Promise<void> {
  await fs.writeFile(DATA_FILE, platos.map(serializeLine).join('\n'), 'utf-8')
}

// ── KV helpers (Vercel production) ───────────────────────────────────────────

async function kvGetPlatos(): Promise<Plato[]> {
  const { kv } = await import('@vercel/kv')
  const data = await kv.get<Plato[]>(KV_KEY)
  if (!data) {
    await kv.set(KV_KEY, SEED)
    return SEED
  }
  return data
}

async function kvWritePlatos(platos: Plato[]): Promise<void> {
  const { kv } = await import('@vercel/kv')
  await kv.set(KV_KEY, platos)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getPlatos(): Promise<Plato[]> {
  return useKV ? kvGetPlatos() : fsGetPlatos()
}

async function writePlatos(platos: Plato[]): Promise<void> {
  return useKV ? kvWritePlatos(platos) : fsWritePlatos(platos)
}

export async function addPlato(nombre: string, precio: number): Promise<Plato> {
  const platos = await getPlatos()
  const maxId = platos.reduce((max, p) => Math.max(max, p.id), 0)
  const nuevo: Plato = { id: maxId + 1, nombre, precio, activo: true }
  await writePlatos([...platos, nuevo])
  return nuevo
}

export async function updatePlato(
  id: number,
  updates: Partial<Omit<Plato, 'id'>>
): Promise<void> {
  const platos = await getPlatos()
  await writePlatos(platos.map((p) => (p.id === id ? { ...p, ...updates } : p)))
}

export async function deletePlato(id: number): Promise<void> {
  const platos = await getPlatos()
  await writePlatos(platos.filter((p) => p.id !== id))
}
