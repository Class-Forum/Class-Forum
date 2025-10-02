import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// 验证邮箱验证码
export async function POST(request: NextRequest) {
  console.log('[Verify Code API] 验证验证码请求开始')
  
  try {
    const { email, code } = await request.json()
    
    console.log('[Verify Code API] 接收到的数据:', { email, code })
    
    if (!email || !code) {
      console.error('[Verify Code API] 邮箱或验证码为空')
      return NextResponse.json({ 
        error: '邮箱和验证码都是必填的' 
      }, { status: 400 })
    }

    // 在实际应用中，这里应该从数据库或缓存中验证验证码
    // 由于我们可能没有验证码表，这里简化处理
    
    // 开发环境下允许任何验证码通过（便于测试）
    if (process.env.NODE_ENV === 'development') {
      console.log('[Verify Code API] 开发模式：验证码自动通过')
      
      // 获取用户信息
      const { data: userData, error: userError } = await supabaseServer
        .from('users')
        .select('id, email, username')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        console.error('[Verify Code API] 用户不存在:', email)
        return NextResponse.json({ 
          error: '用户不存在' 
        }, { status: 400 })
      }

      // 生成临时密码
      const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      
      console.log('[Verify Code API] 验证成功，返回临时密码')
      
      return NextResponse.json({ 
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username
        },
        tempPassword
      })
    }

    // 生产环境应该实现真实的验证逻辑
    // 这里简化处理，实际应该查询验证码表
    console.error('[Verify Code API] 生产环境需要实现验证码验证逻辑')
    
    return NextResponse.json({ 
      error: '验证码验证功能暂未实现，请使用用户名密码登录' 
    }, { status: 501 })
    
  } catch (error) {
    console.error('[Verify Code API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '验证验证码失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}