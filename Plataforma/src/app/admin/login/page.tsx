import { FormularioLogin } from '@/components/FormularioLogin'

export const metadata = { title: 'Admin · Entrar' }

export default function PaginaLoginAdmin() {
  return <FormularioLogin rol="admin" titulo="Panel de administración" nota="Acceso restringido" />
}
