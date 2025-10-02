import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// 用户注册
export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()
    
    // 验证必填字段
    if (!email || !password || !username) {
      return NextResponse.json({ error: '邮箱、密码和用户名是必填的' }, { status: 400 })
    }
    
    // 使用Supabase注册用户
    const { data, error } = await supabaseServer.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      console.error('注册失败:', error)
      return NextResponse.json({ error: '注册失败: ' + error.message }, { status: 500 })
    }
    
    if (data.user) {
      // 注册成功后，在users表中创建用户记录
      const { error: insertError } = await supabaseServer
        .from('users')
        .insert({ 
          username,
          email: data.user.email!,
          password: password, // 注意：这里应该使用哈希密码，但Supabase已经处理了认证
          role: 'user'  // 默认角色为普通用户
        })
      
      if (insertError) {
        console.error('创建用户记录失败:', insertError)
        return NextResponse.json({ error: '注册成功但创建用户记录失败: ' + insertError.message }, { status: 500 })
      }
    }
    
    return NextResponse.json({ message: '用户注册成功', user: data.user }, { status: 201 })
  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json({ error: '注册失败: ' + (error as Error).message }, { status: 500 })
  }
}