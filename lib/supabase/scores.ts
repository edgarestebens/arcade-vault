import { createClient } from './server'

export interface Score {
  id: string
  game_id: string
  player_name: string
  score: number
  created_at: string
}

/**
 * Devuelve los `limit` mejores scores de un juego, ordenados por puntuación descendente.
 * Pensado para Server Components.
 */
export async function getTopScores(gameId: string, limit = 10): Promise<Score[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[scores] getTopScores error:', error.message)
    return []
  }
  return data as Score[]
}
