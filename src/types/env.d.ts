// 环境变量类型定义
interface ProcessEnv {
  // Supabase 配置
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SECRET_KEY: string
  SUPABASE_SERVICE_KEY: string
  
  // 数据库配置
  DATABASE_URL: string
  
  // 管理员账户
  NEXT_PUBLIC_ADMIN_USERNAME: string
  NEXT_PUBLIC_ADMIN_PASSWORD: string
  
  // 存储配置
  NEXT_PUBLIC_STORAGE_URL: string
}

export {}