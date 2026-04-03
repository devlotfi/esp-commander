import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ai/live')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/ai/live"!</div>
}
