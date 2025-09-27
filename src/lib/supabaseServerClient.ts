import { createClient } from '@supabase/supabase-js'

// 服务器端客户端，使用密钥
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || ''

export const supabaseServer = createClient(supabaseUrl, supabaseSecretKey)