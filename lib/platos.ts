import { promises as fs } from 'fs'
import path from 'path'

export type Plato = {
  id: number
  nombre: string
  precio: number
  activo: boolean
}

const DATA_FILE = path.join(process.cwd(), 'data', 'platos.txt')

function parseLine(line: string): Plato | null {
  const parts = line.split('|')
  if (parts.length !== 4) return null
  const id = parseInt(parts[0])
  const precio = parseFloat(parts[2])
  if (isNaN(id) || isNaN(precio)) return null
  return { id, nombre: parts[1], precio, activo: parts[3].trim() === 'true' }
}

function serialize(plato: Plato): string {
  return `${plato.id}|${plato.nombre}|${plato.precio}|${plato.activo}`
}

export async function getPlatos(): Promise<Plato[]> {
  const content = await fs.readFile(DATA_FILE, 'utf-8')
  return content
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map(parseLine)
    .filter((p): p is Plato => p !== null)
}

async function writePlatos(platos: Plato[]): Promise<void> {
  await fs.writeFile(DATA_FILE, platos.map(serialize).join('\n'), 'utf-8')
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
