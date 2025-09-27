import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// 获取特定帖子的回复
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 等待params解析
    const { id } = await params;
    
    // 从Supabase获取特定帖子的回复
    const { data: replies, error } = await supabaseServer
      .from('replies')
      .select(`
        id,
        content,
        created_at,
        author_id
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('获取回复失败:', error)
      return NextResponse.json({ error: '获取回复失败: ' + error.message }, { status: 500 })
    }
    
    // 格式化数据以匹配前端期望的结构
    const formattedReplies = replies?.map(reply => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.created_at,
      author: {
        username: '未知用户'  // 简化处理，暂不查询用户信息
      }
    })) || []
    
    return NextResponse.json(formattedReplies)
  } catch (error) {
    console.error('获取回复失败:', error)
    return NextResponse.json({ error: '获取回复失败: ' + (error as Error).message }, { status: 500 })
  }
}

// 为特定帖子添加回复
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { content, authorId } = await request.json()
    
    // 等待params解析
    const { id } = await params;
    
    // 验证必填字段
    if (!content || !authorId) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 在Supabase中创建回复
    const { data: reply, error } = await supabaseServer
      .from('replies')
      .insert({
        content,
        author_id: authorId,
        post_id: id
      })
      .select()
      .single()
    
    if (error) {
      console.error('创建回复失败:', error)
      return NextResponse.json({ error: '创建回复失败: ' + error.message }, { status: 500 })
    }
    
    return NextResponse.json(reply, { status: 201 })
  } catch (error) {
    console.error('创建回复失败:', error)
    return NextResponse.json({ error: '创建回复失败: ' + (error as Error).message }, { status: 500 })
  }
}