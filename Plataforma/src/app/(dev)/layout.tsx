import { Shell } from '@/components/shell/Shell'

export default function LayoutCaptura({ children }: { children: React.ReactNode }) {
  return <Shell area="dev">{children}</Shell>
}
