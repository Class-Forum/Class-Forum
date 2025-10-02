import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// 获取所有帖子
export async function GET() {
  console.log('[Posts API] GET 请求开始')
  
  try {
    // 从Supabase获取帖子
    console.log('[Posts API] 开始从数据库获取帖子')
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
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[Posts API] 数据库查询错误:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: '获取帖子失败', 
        details: error.message 
      }, { status: 500 })
    }
    
    console.log(`[Posts API] 成功获取 ${posts?.length || 0} 条帖子`)
    
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
    
    console.log('[Posts API] GET 请求成功完成')
    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error('[Posts API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '获取帖子失败', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 创建新帖子
export async function POST(request: Request) {
  console.log('[Posts API] POST 请求开始')
  
  try {
    const body = await request.json()
    console.log('[Posts API] 请求体:', JSON.stringify(body, null, 2))
    
    const { title, content, authorId, categoryId } = body
    
    // 验证必填字段
    if (!title || !content || !authorId || !categoryId) {
      console.error('[Posts API] 缺少必填字段:', {
        title: !!title,
        content: !!content,
        authorId: !!authorId,
        categoryId: !!categoryId
      })
      return NextResponse.json({ 
        error: '缺少必填字段',
        details: '请填写标题、内容、作者ID和分类ID'
      }, { status: 400 })
    }
    
    console.log('[Posts API] 开始创建帖子')
    
    // 在Supabase中创建帖子
    const { data: post, error } = await supabaseServer
      .from('posts')
      .insert({
        title,
        content,
        author_id: authorId,
        category_id: categoryId
      })
      .select()
      .single()
    
    if (error) {
      console.error('[Posts API] 数据库插入错误:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: '创建帖子失败',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('[Posts API] 帖子创建成功:', { postId: post.id })
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('[Posts API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '创建帖子失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}