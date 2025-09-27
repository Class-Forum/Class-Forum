'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: number
  title: string
  content: string
  author: {
    username: string
  }
  category: {
    name: string
  }
  replies: {
    id: number
  }[]
  createdAt: string
}

interface Reply {
  id: number
  content: string
  author: {
    username: string
  }
  createdAt: string
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [newReply, setNewReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 等待params解析
        const { id } = await params;
        
        // 获取帖子详情
        const postResponse = await fetch(`/api/posts`)
        if (!postResponse.ok) {
          throw new Error('获取帖子失败')
        }
        const posts: Post[] = await postResponse.json()
        const foundPost = posts.find(p => p.id === parseInt(id))
        if (!foundPost) {
          throw new Error('帖子未找到')
        }
        setPost(foundPost)
        
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

  // 渲染包含媒体的内容
  const renderContentWithMedia = (content: string) => {
    // 分割内容为行
    const lines = content.split('
')
    return (
      <>
        {lines.map((line, index) => {
          // 检查是否为图片链接
          if (line.match(/!\[.*\]\(.*\)/)) {
            const imageUrl = line.match(/!\[.*\]\((.*)\)/)?.[1]
            // 将链接前缀替换为自定义域名
            const customImageUrl = imageUrl?.replace(
              /^https:\/\/[^\/]+\/storage\/v1\/object\/public/,
              'https://ph.20204.xyz'
            )
            return (
              <div key={index} className="my-4">
                <img src={customImageUrl} alt="上传的图片" className="max-w-full h-auto rounded" />
              </div>
            )
          }
          // 检查是否为音频链接
          else if (line.match(/\[.*\]\(.*\)/) && line.includes('.mp3')) {
            const audioUrl = line.match(/\[.*\]\((.*)\)/)?.[1]
            // 将链接前缀替换为自定义域名
            const customAudioUrl = audioUrl?.replace(
              /^https:\/\/[^\/]+\/storage\/v1\/object\/public/,
              'https://ph.20204.xyz'
            )
            return (
              <div key={index} className="my-4">
                <audio controls className="w-full">
                  <source src={customAudioUrl} type="audio/mpeg" />
                  您的浏览器不支持音频元素。
                </audio>
              </div>
            )
          }
          // 普通文本行
          else if (line.trim() !== '') {
            return (
              <p key={index} className="mb-4">
                {line}
              </p>
            )
          }
          // 空行
          else {
            return <br key={index} />
          }
        })}
      </>
    )
  }

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
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-700 font-medium">{post.author.username.charAt(0)}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{post.author.username}</p>
                  <p className="text-sm text-gray-500">
                    发布于 {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {post.category.name}
              </span>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="prose max-w-none text-gray-700">
              {renderContentWithMedia(post.content)}
            </div>
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
                          <span className="text-gray-700 text-sm font-medium">{reply.author.username.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{reply.author.username}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(reply.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 ml-11">
                      <p className="text-gray-700">{reply.content}</p>
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
                  回复内容
                </label>
                <div className="mt-1">
                  <textarea
                    id="reply"
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="输入你的回复..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                    rows={4}
                    required
                  />
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