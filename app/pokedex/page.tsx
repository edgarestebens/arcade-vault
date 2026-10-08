import type { Metadata } from 'next'
import { PokedexCounter } from './PokedexCounter'

export const metadata: Metadata = {
  title: 'Pokédex · Arcade Vault',
  description: 'Suma de uno en uno y mira el Pokémon de esa entrada.',
}

export default function PokedexPage() {
  return <PokedexCounter />
}
