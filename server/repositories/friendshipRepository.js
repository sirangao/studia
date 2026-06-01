const supabase = require('../db')

function orderedIds(userId, friendId) {
  return { low: Math.min(userId, friendId), high: Math.max(userId, friendId) }
}

function normalize(row) {
  return { user_id: row.user_id_low, friend_id: row.user_id_high, requesterId: row.requester_id, status: row.status }
}

async function findByPair(userId, friendId) {
  const { low, high } = orderedIds(userId, friendId)
  const { data, error } = await supabase
    .from('friendships').select('status').eq('user_id_low', low).eq('user_id_high', high).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

async function findPendingByPair(requesterId, receiverId) {
  const { low, high } = orderedIds(requesterId, receiverId)
  const { data, error } = await supabase
    .from('friendships').select().eq('user_id_low', low).eq('user_id_high', high).eq('status', 'pending').single()
  if (error && error.code !== 'PGRST116') throw error
  return data ? normalize(data) : null
}

async function create(userId, friendId) {
  const { low, high } = orderedIds(userId, friendId)
  const { data, error } = await supabase
    .from('friendships').insert({ user_id_low: low, user_id_high: high, requester_id: userId, status: 'pending' }).select().single()
  if (error) throw error
  return normalize(data)
}

async function accept(requesterId, receiverId) {
  const { low, high } = orderedIds(requesterId, receiverId)
  const { data, error } = await supabase
    .from('friendships').update({ status: 'accepted' }).eq('user_id_low', low).eq('user_id_high', high).select().single()
  if (error) throw error
  return normalize(data)
}

async function findAcceptedByUserId(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('user_id_low, user_id_high')
    .or(`user_id_low.eq.${userId},user_id_high.eq.${userId}`)
    .eq('status', 'accepted')
  if (error) throw error
  return data.map(row => ({ user_id: row.user_id_low, friend_id: row.user_id_high }))
}

module.exports = { findByPair, findPendingByPair, create, accept, findAcceptedByUserId }
