'use server'

import { addPlato, updatePlato, deletePlato } from '@/lib/platos'
import { revalidatePath } from 'next/cache'

export async function actionAddPlato(formData: FormData) {
  const nombre = (formData.get('nombre') as string).trim()
  const precio = parseFloat(formData.get('precio') as string)
  if (!nombre || isNaN(precio) || precio < 0) return
  await addPlato(nombre, precio)
  revalidatePath('/gestion')
}

export async function actionUpdatePlato(id: number, nombre: string, precio: number) {
  await updatePlato(id, { nombre, precio })
  revalidatePath('/gestion')
}

export async function actionDeletePlato(id: number) {
  await deletePlato(id)
  revalidatePath('/gestion')
}

export async function actionToggleActivo(id: number, activo: boolean) {
  await updatePlato(id, { activo })
  revalidatePath('/gestion')
}
