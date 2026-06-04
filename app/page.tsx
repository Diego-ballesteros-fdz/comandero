import { getPlatos } from '@/lib/platos'
import { ListaPlatos } from '@/components/ui/ListaPlatos'

export default async function Home() {
  const platos = await getPlatos()
  return <ListaPlatos platos={platos} />
}
