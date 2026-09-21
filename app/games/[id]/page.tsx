import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES } from '../../data'
import { GameLeaderboard } from '../../components/GameLeaderboard'

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }))
}

export default async function GameDetail({ params }: Props) {
  const { id } = await params
  const game = GAMES.find((g) => g.id === id)
  if (!game) notFound()

  const difficulties: Record<string, string> = {
    ARCADE: 'MEDIA',
    PUZZLE: 'ALTA',
    SHOOTER: 'DIFÍCIL',
    VERSUS: 'VARIABLE',
  }

  return (
    <div className="av-detail fade-in">
      {/* Columna izquierda: cover + info */}
      <div>
        {/* Cover grande */}
        <div className="detail-cover">
          <div className={`cover-bg ${game.cover}`} style={{ position: 'absolute', inset: 0 }} />
        </div>

        {/* Info */}
        <div className="detail-info" style={{ marginTop: 24 }}>
          <h2 className={`neon-${game.color}`}>{game.title}</h2>

          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>RETRO</span>
          </div>

          <p>{game.long}</p>

          {/* Strip de 3 stats */}
          <div className="stat-strip">
            <div>
              <div className="l">PARTIDAS</div>
              <div className="v">{game.plays}</div>
            </div>
            <div>
              <div className="l">MEJOR GLOBAL</div>
              <div className="v">{game.best.toLocaleString()}</div>
            </div>
            <div>
              <div className="l">DIFICULTAD</div>
              <div className="v">{difficulties[game.cat] ?? 'MEDIA'}</div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="detail-actions">
            <Link href={`/games/${game.id}/play`} className="btn pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/biblioteca" className="btn ghost">
              ← VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      {/* Columna derecha: leaderboard real desde Supabase */}
      <GameLeaderboard gameId={game.id} />
    </div>
  )
}
