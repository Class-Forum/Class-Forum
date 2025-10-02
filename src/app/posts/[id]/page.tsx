'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ReactMarkdown from 'react-markdown'

interface Post {
  id: number
  title: string
  content: string
  author: {
    id: number
    username: string
    avatar?: string
  }
  category: {
    id: number
    name: string
  }
  replies: {
    id: number
  }[]
  created_at: string
}

interface Reply {
  id: number
  content: string
  author: {
    username: string
  }
  created_at: string
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [newReply, setNewReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 等待params解析
        const { id } = await params;
        
        // 获取当前用户信息
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        
        // 获取帖子详情
        const postResponse = await fetch(`/api/posts/${id}`)
        if (!postResponse.ok) {
          throw new Error('获取帖子失败')
        }
        const foundPost: Post = await postResponse.json()
        setPost(foundPost)
        setEditTitle(foundPost.title)
        setEditContent(foundPost.content)
        
        // 获取回复
        const replyResponse = await fetch(`/api/posts/${id}/replies`)
        if (!replyResponse.ok) {
          throw new Error('获取回复失败')
        }
        const replyData = await replyResponse.json()
        setReplies(replyData)
      } catch (err) {
        setError('获取数据时出错')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReply.trim()) return
    
    try {
      // 等待params解析
      const { id } = await params;
      
      // 获取当前用户信息
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // 如果没有会话，重定向到登录页面
        router.push('/login')
        return
      }
      
      const authorId = session.user.id
      
      const response = await fetch(`/api/posts/${id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newReply, authorId }),
      })
      
      if (!response.ok) {
        // 检查是否因为认证问题导致的错误
        if (response.status === 401 || response.status === 403) {
          router.push('/login')
          return
        }
        throw new Error('回复失败')
      }
      
      const replyData = await response.json()
      setReplies([...replies, replyData])
      setNewReply('')
    } catch (err) {
      setError('回复时出错')
      console.error(err)
    }
  }

  // 删除帖子
  const handleDeletePost = async () => {
    if (!confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
      return
    }
    
    try {
      const { id } = await params;
      
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('删除帖子失败')
      }
      
      // 删除成功，跳转到首页
      router.push('/')
      router.refresh()
    } catch (err) {
      setError('删除帖子时出错')
      console.error(err)
    }
  }

  // 编辑帖子
  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { id } = await params;
      
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          categoryId: post?.category.id
        }),
      })
      
      if (!response.ok) {
        throw new Error('更新帖子失败')
      }
      
      const updatedPost = await response.json()
      setPost({
        ...post!,
        title: updatedPost.title,
        content: updatedPost.content
      })
      setIsEditing(false)
      setError('')
    } catch (err) {
      setError('更新帖子时出错')
      console.error(err)
    }
  }

  // 检查当前用户是否有权限编辑/删除帖子
  const canEditPost = currentUser && post && currentUser.id.toString() === post.author.id.toString()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold">班级论坛</h1>
                </div>
              </div>
              <div className="flex items-center">
                <div className="animate-pulse bg-gray-200 rounded h-8 w-20"></div>
              </div>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold">班级论坛</h1>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/login')}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  登录
                </button>
              </div>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold">班级论坛</h1>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/login')}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  登录
                </button>
              </div>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            帖子未找到
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">班级论坛</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                首页
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.back()}
          className="mb-4 text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          ← 返回
        </button>
        
        <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-3xl font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded px-2 py-1 w-full"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
                )}
              </div>
              
              {canEditPost && (
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleEditPost}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditTitle(post.title)
                          setEditContent(post.content)
                        }}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        编辑
                      </button>
                      <button
                        onClick={handleDeletePost}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {post.author.avatar ? (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-700 font-medium">{post.author.username.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{post.author.username}</p>
                  <p className="text-sm text-gray-500">
                    发布于 {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {post.category.name}
              </span>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md"
                placeholder="输入帖子内容..."
              />
            ) : (
              <div className="prose max-w-none text-gray-700">
                <ReactMarkdown 
                  components={{
                    img: ({node, ...props}) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img {...props} className="max-w-full h-auto rounded-lg shadow-md my-4" alt={props.alt || "图片"} />
                    ),
                    audio: ({node, ...props}) => (
                      <div className="my-4">
                        <audio {...props} controls className="w-full" />
                      </div>
                    ),
                    a: ({node, ...props}) => {
                      // 如果是音频链接，显示为音频播放器
                      if (props.href?.endsWith('.mp3') || props.href?.endsWith('.wav') || props.href?.endsWith('.ogg')) {
                        return (
                          <div className="my-4">
                            <audio src={props.href} controls className="w-full" />
                            <p className="text-sm text-gray-500 mt-1">{props.children}</p>
                          </div>
                        )
                      }
                      // 其他链接正常显示
                      return <a {...props} className="text-blue-600 hover:text-blue-800" />
                    }
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">回复 ({replies.length})</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {replies.length > 0 ? (
              <div className="space-y-6">
                {replies.map((reply) => (
                  <div key={reply.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-700 text-sm font-medium">{reply.author?.username?.charAt(0) || 'U'}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{reply.author?.username || '未知用户'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(reply.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 ml-11">
                      <div className="text-gray-700">
                        <ReactMarkdown>
                          {reply.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暂无回复，快来发表第一个回复吧！</p>
            )}
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">发表回复</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleReplySubmit}>
              <div>
                <label htmlFor="reply" className="block text-sm font-medium text-gray-700">
                  回复内容 (支持Markdown语法)
                </label>
                <div className="mt-1">
                  <textarea
                    id="reply"
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="输入你的回复，支持Markdown语法..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                    rows={4}
                    required
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  支持Markdown语法：**粗体** *斜体* `代码` # 标题 ## 子标题
                  [链接](url) ![图片](url)
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  提交回复
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}