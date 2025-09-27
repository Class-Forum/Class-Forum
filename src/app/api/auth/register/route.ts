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
      // 注册成功后，更新用户的用户名
      const { error: updateError } = await supabaseServer
        .from('users')
        .update({ username })
        .eq('id', data.user.id)
      
      if (updateError) {
        console.error('更新用户名失败:', updateError)
        return NextResponse.json({ error: '注册成功但更新用户名失败: ' + updateError.message }, { status: 500 })
      }
    }
    
    return NextResponse.json({ message: '用户注册成功', user: data.user }, { status: 201 })
  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json({ error: '注册失败: ' + (error as Error).message }, { status: 500 })
  }
}