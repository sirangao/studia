const { createClient } = require('@supabase/supabase-js')

const supabase = process.env.USE_FAKE_DB ? require('./testDb') : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

module.exports = supabase

