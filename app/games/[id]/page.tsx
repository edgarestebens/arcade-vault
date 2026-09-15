import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES, seededScores } from '../../data'

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

  const scores = seededScores(game.title.charCodeAt(0) + game.title.length, 10)

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

      {/* Columna derecha: leaderboard */}
      <div className="leaderboard slide-in">
        <h3>🏆 TOP 10 GLOBAL</h3>
        {scores.map((row) => (
          <div
            key={row.rank}
            className={`lb-row${row.rank === 1 ? ' top1' : row.rank === 2 ? ' top2' : row.rank === 3 ? ' top3' : ''}`}
          >
            <span className="rk">#{row.rank}</span>
            <span className="pl">{row.name}</span>
            <span className="sc">{row.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
