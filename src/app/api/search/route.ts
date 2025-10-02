import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// 搜索帖子API
export async function GET(request: NextRequest) {
  console.log('[Search API] GET 请求开始')
  
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    console.log('[Search API] 搜索查询:', { query })
    
    if (!query || query.trim() === '') {
      console.error('[Search API] 搜索查询为空')
      return NextResponse.json({ 
        error: '搜索查询不能为空',
        details: '请输入搜索关键词'
      }, { status: 400 })
    }
    
    // 使用Supabase的全文搜索功能
    console.log('[Search API] 开始数据库搜索')
    const { data: posts, error } = await supabaseServer
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        author_id,
        category_id
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[Search API] 数据库查询错误:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: '搜索失败', 
        details: error.message 
      }, { status: 500 })
    }
    
    console.log(`[Search API] 搜索到 ${posts?.length || 0} 条结果`)
    
    // 格式化数据以匹配前端期望的结构
    const formattedPosts = posts?.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      author: {
        username: '未知用户'  // 简化处理，暂不查询用户信息
      },
      category: {
        name: '未分类'  // 简化处理，暂不查询分类信息
      },
      replies: []  // 简化处理，暂不查询回复信息
    })) || []
    
    console.log('[Search API] GET 请求成功完成')
    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error('[Search API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '搜索失败', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}