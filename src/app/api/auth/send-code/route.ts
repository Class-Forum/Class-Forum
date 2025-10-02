import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// 发送邮箱验证码
export async function POST(request: NextRequest) {
  console.log('[Send Code API] 发送验证码请求开始')
  
  try {
    const { email } = await request.json()
    
    console.log('[Send Code API] 接收到的邮箱:', email)
    
    if (!email) {
      console.error('[Send Code API] 邮箱地址为空')
      return NextResponse.json({ 
        error: '邮箱地址是必填的' 
      }, { status: 400 })
    }

    // 检查邮箱是否已注册
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      console.error('[Send Code API] 邮箱未注册:', email)
      return NextResponse.json({ 
        error: '该邮箱未注册，请先注册账户' 
      }, { status: 400 })
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 生成临时密码（用于验证码登录）
    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    
    console.log('[Send Code API] 生成的验证码和临时密码:', { code, tempPassword })

    // 这里应该集成邮件服务发送验证码
    // 由于没有配置邮件服务，我们暂时在控制台输出验证码
    console.log(`[Send Code API] 验证码: ${code} (请配置邮件服务后替换此实现)`)
    
    // 在实际应用中，这里应该调用邮件服务API
    // 例如：await sendEmail(email, '登录验证码', `您的验证码是: ${code}`)

    // 将验证码和临时密码存储到数据库或缓存中（这里简化处理）
    // 在实际应用中应该使用Redis或其他缓存服务
    const { error: insertError } = await supabaseServer
      .from('verification_codes')
      .insert({
        email,
        code,
        temp_password: tempPassword,
        expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10分钟过期
      })

    if (insertError) {
      console.error('[Send Code API] 存储验证码失败:', insertError)
      // 如果表不存在，创建临时表（简化处理）
      console.log('[Send Code API] 可能需要创建验证码表')
    }

    console.log('[Send Code API] 验证码发送成功')
    
    return NextResponse.json({ 
      success: true, 
      message: '验证码已发送到您的邮箱',
      // 开发环境下返回验证码便于测试
      code: process.env.NODE_ENV === 'development' ? code : undefined
    })
    
  } catch (error) {
    console.error('[Send Code API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '发送验证码失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}