import { Shell } from '@/components/shell/Shell'

export const metadata = { title: 'Admin · Agencia Hello' }

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <Shell area="admin">{children}</Shell>
}
