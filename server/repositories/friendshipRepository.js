const supabase = require('../db')

function lowBeforeHigh(lo, hi){
  return Number(lo) < Number(hi) ? [lo, hi] : [hi, lo];
}

async function findByPair(userId, friendId) {
  const [low_id, high_id] = lowBeforeHigh(userId, friendId);
  const { data, error } = await supabase
    .from('friendships').select('status, requester_id').eq('user_id_low', low_id).eq('user_id_high', high_id).single();
  if (error && error.code !== 'PGRST116') throw error
  return data
}

async function findPendingByPair(userId, friendId) {
  const [low_id, high_id] = lowBeforeHigh(userId, friendId);
  const { data, error } = await supabase
    .from('friendships').select().eq('user_id_low', low_id).eq('user_id_high', high_id).single();
  if (error && error.code !== 'PGRST116') throw error
  return data
}

async function create(requesterId, friendId) {
  const [low_id, high_id] = lowBeforeHigh(requesterId, friendId);
  const { data, error } = await supabase
    .from('friendships').insert({ user_id_low: low_id, user_id_high: high_id, status: 'pending', requester_id: requesterId }).select().single();
  if (error) throw error
  return data
}

async function accept(userId, friendId) {
  const [low_id, high_id] = lowBeforeHigh(userId, friendId);
  const { data, error } = await supabase
    .from('friendships').update({ status: 'accepted' }).eq('user_id_low', low_id).eq('user_id_high', high_id).select().single();
  if (error) throw error
  return data
}

async function findAcceptedByUserId(userId) { 
  const { data, error } = await supabase 
    .from('friendships')
    .select('user_id_low, user_id_high')
    .eq('status', 'accepted')
    .or(`user_id_low.eq.${Number(userId)},user_id_high.eq.${Number(userId)}`)

  if (error) throw error
  return data
}

async function findFriendRequests(userId){ 
  const { data, error } = await supabase
      .from('friendships')
      .select('user_id_low, user_id_high, requester_id')
      .eq('status', 'pending')
      .neq('requester_id', Number(userId))
      .or(`user_id_low.eq.${Number(userId)},user_id_high.eq.${Number(userId)}`)

    if (error) throw error
    return data
}

async function deleteFriendship(userId, friendId){
  const [low_id, high_id] = lowBeforeHigh(userId, friendId);
  const { data, error } = await supabase  
    .from('friendships').delete().eq('user_id_low', low_id).eq('user_id_high', high_id)
  if(error) throw error
}

module.exports = { findByPair, findPendingByPair, create, accept, findAcceptedByUserId, findFriendRequests, deleteFriendship }
