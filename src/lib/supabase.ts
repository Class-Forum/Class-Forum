import { createClient } from '@supabase/supabase-js'

// 使用环境变量中的 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// 创建标准客户端（用于前端操作）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 创建服务端客户端（用于需要更高权限的操作）
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase