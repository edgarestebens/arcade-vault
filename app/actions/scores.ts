'use server'

import { createClient } from '../../lib/supabase/server'
import type { Score } from '../../lib/supabase/scores'

/**
 * Inserta una puntuación en Supabase.
 * Se invoca desde Client Components como Server Action.
 *
 * @returns { data } con el registro creado, o { error } con el mensaje de error.
 */
export async function insertScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<{ data?: Score; error?: string }> {
  if (!gameId || !playerName.trim() || score < 0) {
    return { error: 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scores')
    .insert({
      game_id: gameId,
      player_name: playerName.slice(0, 10).toUpperCase(),
      score,
    })
    .select()
    .single()

  if (error) {
    console.error('[scores] insertScore error:', error.message)
    return { error: error.message }
  }

  return { data: data as Score }
}
