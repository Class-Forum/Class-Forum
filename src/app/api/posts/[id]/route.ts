import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// eslint-disable-next-line @typescript-eslint/no-explicit-any

// 获取单个帖子详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Post Detail API] GET 请求开始')
  
  try {
    const { id } = await params;
    console.log('[Post Detail API] 帖子ID:', id)
    
    if (!id || isNaN(parseInt(id))) {
      console.error('[Post Detail API] 无效的帖子ID')
      return NextResponse.json({ 
        error: '无效的帖子ID'
      }, { status: 400 })
    }
    
    // 从Supabase获取帖子详情
    const { data: post, error } = await supabaseServer
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        author_id,
        category_id
      `)
      .eq('id', parseInt(id))
      .single()
    
    if (error) {
      console.error('[Post Detail API] 数据库查询错误:', {
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
    
    if (!post) {
      console.error('[Post Detail API] 帖子未找到')
      return NextResponse.json({ 
        error: '帖子未找到'
      }, { status: 404 })
    }
    
    // 获取作者信息
    const { data: authorData } = await supabaseServer
      .from('users')
      .select('username, avatar')
      .eq('id', post.author_id)
      .single()
    
    // 获取分类信息
    const { data: categoryData } = await supabaseServer
      .from('categories')
      .select('name')
      .eq('id', post.category_id)
      .single()
    
    // 格式化数据
    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      author: {
        id: post.author_id,
        username: authorData?.username || '未知用户',
        avatar: authorData?.avatar
      },
      category: {
        id: post.category_id,
        name: categoryData?.name || '未分类'
      },
      replies: []  // 回复将在单独的API中获取
    }
    
    console.log('[Post Detail API] GET 请求成功完成')
    return NextResponse.json(formattedPost)
  } catch (error) {
    console.error('[Post Detail API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '获取帖子失败', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 更新帖子
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Post Detail API] PUT 请求开始')
  
  try {
    const { id } = await params;
    const { title, content, categoryId } = await request.json()
    
    console.log('[Post Detail API] 更新数据:', { id, title, content, categoryId })
    
    if (!id || isNaN(parseInt(id))) {
      console.error('[Post Detail API] 无效的帖子ID')
      return NextResponse.json({ 
        error: '无效的帖子ID'
      }, { status: 400 })
    }
    
    // 验证必填字段
    if (!title || !content || !categoryId) {
      console.error('[Post Detail API] 缺少必填字段')
      return NextResponse.json({ 
        error: '标题、内容和分类都是必填的'
      }, { status: 400 })
    }
    
    // 更新帖子
    const { data: post, error } = await supabaseServer
      .from('posts')
      .update({
        title,
        content,
        category_id: parseInt(categoryId)
      })
      .eq('id', parseInt(id))
      .select()
      .single()
    
    if (error) {
      console.error('[Post Detail API] 数据库更新错误:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: '更新帖子失败',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('[Post Detail API] 帖子更新成功:', { postId: post.id })
    return NextResponse.json(post)
  } catch (error) {
    console.error('[Post Detail API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '更新帖子失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 删除帖子
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Post Detail API] DELETE 请求开始')
  
  try {
    const { id } = await params;
    
    console.log('[Post Detail API] 删除帖子ID:', id)
    
    if (!id || isNaN(parseInt(id))) {
      console.error('[Post Detail API] 无效的帖子ID')
      return NextResponse.json({ 
        error: '无效的帖子ID'
      }, { status: 400 })
    }
    
    // 删除帖子
    const { error } = await supabaseServer
      .from('posts')
      .delete()
      .eq('id', parseInt(id))
    
    if (error) {
      console.error('[Post Detail API] 数据库删除错误:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: '删除帖子失败',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('[Post Detail API] 帖子删除成功')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Post Detail API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '删除帖子失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}