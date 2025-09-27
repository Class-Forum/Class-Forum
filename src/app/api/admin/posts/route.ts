import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// DELETE /api/admin/posts/[id] - 删除帖子（仅管理员）
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 这里应该添加管理员身份验证逻辑
    // 例如检查请求头中的认证令牌
    
    const { error } = await supabaseServer
      .from('posts')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ message: '帖子删除成功' })
  } catch (error) {
    console.error('删除帖子失败:', error)
    return NextResponse.json({ error: '删除帖子失败' }, { status: 500 })
  }
}