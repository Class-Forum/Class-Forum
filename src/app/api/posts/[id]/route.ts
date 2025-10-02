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
    
    // 获取当前用户信息
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Post Detail API] 未提供认证令牌')
      return NextResponse.json({ 
        error: '认证失败',
        details: '请先登录'
      }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // 验证token并获取用户信息
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      console.error('[Post Detail API] 认证失败:', authError)
      return NextResponse.json({ 
        error: '认证失败',
        details: '无效的认证令牌'
      }, { status: 401 })
    }
    
    console.log('[Post Detail API] 当前用户email:', user.email)
    
    // 检查帖子是否存在以及用户是否有权限编辑
    const { data: post, error: postError } = await supabaseServer
      .from('posts')
      .select('author_id, users(email)')
      .eq('id', parseInt(id))
      .single()
    
    if (postError) {
      console.error('[Post Detail API] 帖子查询错误:', postError)
      return NextResponse.json({ 
        error: '帖子不存在',
        details: postError.message
      }, { status: 404 })
    }
    
    if (!post) {
      console.error('[Post Detail API] 帖子未找到')
      return NextResponse.json({ 
        error: '帖子未找到'
      }, { status: 404 })
    }
    
    // 检查用户权限：只有帖子作者或管理员可以编辑帖子
    // 通过email关联Supabase认证用户和数据库用户
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, role')
      .eq('email', user.email)
      .single()
    
    if (userError) {
      console.error('[Post Detail API] 用户查询错误:', userError)
      return NextResponse.json({ 
        error: '权限验证失败',
        details: '无法验证用户权限'
      }, { status: 500 })
    }
    
    if (!userData) {
      console.error('[Post Detail API] 用户未找到')
      return NextResponse.json({ 
        error: '权限验证失败',
        details: '用户信息不存在'
      }, { status: 403 })
    }
    
    // 获取帖子作者信息
    const { data: authorData } = await supabaseServer
      .from('users')
      .select('email')
      .eq('id', post.author_id)
      .single()
    
    const isAuthor = authorData?.email === user.email
    const isAdmin = userData?.role === 'admin'
    
    if (!isAuthor && !isAdmin) {
      console.error('[Post Detail API] 权限不足:', { userEmail: user.email, authorEmail: authorData?.email, isAdmin })
      return NextResponse.json({ 
        error: '权限不足',
        details: '只有帖子作者或管理员可以编辑帖子'
      }, { status: 403 })
    }
    
    console.log('[Post Detail API] 权限验证通过，开始更新帖子')
    
    // 更新帖子
    const { data: updatedPost, error: updateError } = await supabaseServer
      .from('posts')
      .update({
        title,
        content,
        category_id: parseInt(categoryId)
      })
      .eq('id', parseInt(id))
      .select()
      .single()
    
    if (updateError) {
      console.error('[Post Detail API] 数据库更新错误:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return NextResponse.json({ 
        error: '更新帖子失败',
        details: updateError.message
      }, { status: 500 })
    }
    
    console.log('[Post Detail API] 帖子更新成功:', { postId: updatedPost.id })
    return NextResponse.json(updatedPost)
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
    
    // 获取当前用户信息
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Post Detail API] 未提供认证令牌')
      return NextResponse.json({ 
        error: '认证失败',
        details: '请先登录'
      }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // 验证token并获取用户信息
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      console.error('[Post Detail API] 认证失败:', authError)
      return NextResponse.json({ 
        error: '认证失败',
        details: '无效的认证令牌'
      }, { status: 401 })
    }
    
    console.log('[Post Detail API] 当前用户email:', user.email)
    
    // 检查帖子是否存在以及用户是否有权限删除
    const { data: post, error: postError } = await supabaseServer
      .from('posts')
      .select('author_id')
      .eq('id', parseInt(id))
      .single()
    
    if (postError) {
      console.error('[Post Detail API] 帖子查询错误:', postError)
      return NextResponse.json({ 
        error: '帖子不存在',
        details: postError.message
      }, { status: 404 })
    }
    
    if (!post) {
      console.error('[Post Detail API] 帖子未找到')
      return NextResponse.json({ 
        error: '帖子未找到'
      }, { status: 404 })
    }
    
    // 检查用户权限：只有帖子作者或管理员可以删除帖子
    // 通过email关联Supabase认证用户和数据库用户
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, role')
      .eq('email', user.email)
      .single()
    
    if (userError) {
      console.error('[Post Detail API] 用户查询错误:', userError)
      return NextResponse.json({ 
        error: '权限验证失败',
        details: '无法验证用户权限'
      }, { status: 500 })
    }
    
    if (!userData) {
      console.error('[Post Detail API] 用户未找到')
      return NextResponse.json({ 
        error: '权限验证失败',
        details: '用户信息不存在'
      }, { status: 403 })
    }
    
    // 获取帖子作者信息
    const { data: authorData } = await supabaseServer
      .from('users')
      .select('email')
      .eq('id', post.author_id)
      .single()
    
    const isAuthor = authorData?.email === user.email
    const isAdmin = userData?.role === 'admin'
    
    if (!isAuthor && !isAdmin) {
      console.error('[Post Detail API] 权限不足:', { userEmail: user.email, authorEmail: authorData?.email, isAdmin })
      return NextResponse.json({ 
        error: '权限不足',
        details: '只有帖子作者或管理员可以删除帖子'
      }, { status: 403 })
    }
    
    console.log('[Post Detail API] 权限验证通过，开始删除帖子')
    
    // 先删除帖子的所有回复（如果存在外键约束）
    const { error: deleteRepliesError } = await supabaseServer
      .from('replies')
      .delete()
      .eq('post_id', parseInt(id))
    
    if (deleteRepliesError) {
      console.error('[Post Detail API] 删除回复失败:', deleteRepliesError)
      // 继续删除帖子，因为回复可能已经被级联删除
    }
    
    // 删除帖子
    const { error: deleteError } = await supabaseServer
      .from('posts')
      .delete()
      .eq('id', parseInt(id))
    
    if (deleteError) {
      console.error('[Post Detail API] 数据库删除错误:', {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      })
      return NextResponse.json({ 
        error: '删除帖子失败',
        details: deleteError.message
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