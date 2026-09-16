import { FormularioLogin } from '@/components/FormularioLogin'

export const metadata = { title: 'Entrar · Generador de páginas web' }

export default function PaginaLogin() {
  return (
    <FormularioLogin
      rol="dev"
      titulo="Generador de páginas web"
      nota="Acceso para el equipo de desarrollo"
    />
  )
}
