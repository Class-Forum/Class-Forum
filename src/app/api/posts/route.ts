import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// 获取所有帖子
export async function GET() {
  try {
    // 从Supabase获取帖子
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
      console.error('获取帖子失败:', error)
      return NextResponse.json({ error: '获取帖子失败: ' + error.message }, { status: 500 })
    }
    
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
    
    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error('获取帖子失败:', error)
    return NextResponse.json({ error: '获取帖子失败: ' + (error as Error).message }, { status: 500 })
  }
}

// 创建新帖子
export async function POST(request: Request) {
  try {
    const { title, content, authorId, categoryId } = await request.json()
    
    // 验证必填字段
    if (!title || !content || !authorId || !categoryId) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
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
      console.error('创建帖子失败:', error)
      return NextResponse.json({ error: '创建帖子失败: ' + error.message }, { status: 500 })
    }
    
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('创建帖子失败:', error)
    return NextResponse.json({ error: '创建帖子失败: ' + (error as Error).message }, { status: 500 })
  }
}