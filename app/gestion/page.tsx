import { getPlatos } from '@/lib/platos'
import { GestionPlatos } from '@/components/ui/GestionPlatos'

export default async function GestionPage() {
  const platos = await getPlatos()
  return <GestionPlatos platos={platos} />
}
