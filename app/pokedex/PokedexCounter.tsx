'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const FALLBACK_MAX = 1025

type SpeciesName = { language: { name: string }; name: string }

function artwork(id: number, kind: 'official' | 'sprite') {
  if (kind === 'official') {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

function label(name: string) {
  return name.replace(/(^|[\s-])(\p{L})/gu, (_match, sep: string, ch: string) => {
    return sep + ch.toLocaleUpperCase('es')
  })
}

export function PokedexCounter() {
  const [dex, setDex] = useState(1)
  const [max, setMax] = useState(FALLBACK_MAX)
  const [name, setName] = useState('')
  const [nameState, setNameState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [art, setArt] = useState<'official' | 'sprite' | 'none'>('official')

  useEffect(() => {
    const controller = new AbortController()
    fetch('https://pokeapi.co/api/v2/pokemon-species?limit=1', { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { count?: number }) => {
        if (typeof data.count === 'number' && data.count > 0) setMax(data.count)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setNameState('loading')
    setArt('official')
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${dex}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('missing')
        return response.json()
      })
      .then((data: { name: string; names: SpeciesName[] }) => {
        const spanish = data.names.find((entry) => entry.language.name === 'es')
        setName(label(spanish?.name ?? data.name))
        setNameState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setName('')
        setNameState('missing')
      })
    return () => controller.abort()
  }, [dex])

  useEffect(() => {
    const nextId = dex >= max ? 1 : dex + 1
    const preload = new window.Image()
    preload.src = artwork(nextId, 'official')
  }, [dex, max])

  function step(delta: number) {
    setDex((current) => {
      const next = current + delta
      if (next > max) return 1
      if (next < 1) return max
      return next
    })
  }

  const padded = String(dex).padStart(4, '0')
  const shownName =
    nameState === 'loading' ? 'Buscando…' : nameState === 'missing' ? 'Sin registro' : name
  const alt = nameState === 'ready' ? name : `Pokémon número ${dex}`

  return (
    <section className="dex">
      <div className="dex-cabinet">
        <h1 className="dex-count" aria-label={`Pokémon número ${dex}`}>
          <span aria-hidden="true">{padded}</span>
        </h1>

        <div className="dex-stage">
          {art === 'none' ? (
            <p className="dex-missing">Sin imagen para este número.</p>
          ) : (
            <Image
              key={`${dex}-${art}`}
              className="dex-art"
              src={artwork(dex, art === 'sprite' ? 'sprite' : 'official')}
              alt={alt}
              width={280}
              height={280}
              priority={dex < 3}
              onError={() => {
                setArt((current) => (current === 'official' ? 'sprite' : 'none'))
              }}
            />
          )}
        </div>

        <p className="dex-name" aria-live="polite">
          {shownName}
        </p>

        <div className="dex-actions">
          <button type="button" className="btn ghost dex-prev" onClick={() => step(-1)}>
            Restar 1
          </button>
          <button type="button" className="dex-next" onClick={() => step(1)}>
            Sumar 1
          </button>
        </div>

        <p className="dex-note">Cada clic suma uno y cambia el Pokémon de la pantalla.</p>
      </div>
    </section>
  )
}
