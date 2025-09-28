'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
  status: string
  created_at: string
}

interface Reply {
  id: number
  content: string
  author: {
    username: string
  }
  post: {
    title: string
  }
  status: string
  created_at: string
}

export default function AdminContentPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [replies, setReplies] = useState<Reply[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'replies'>('posts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // 检查管理员权限
  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/admin')
          return
        }
        
        // 这里应该检查用户是否是管理员
        // 为简化起见，我们假设能访问此页面的都是管理员
      } catch (error) {
        console.error('检查权限失败:', error)
        router.push('/admin')
      }
    }

    checkAdminPermission()
  }, [router])

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'posts') {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            status,
            created_at,
            author_id,
            category_id,
            users(username),
            categories(name)
          `)
          .order('created_at', { ascending: false })
        
        if (error) {
          throw new Error(error.message)
        }
        
        // 格式化数据
        const formattedPosts = data?.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          author: {
            username: post.users?.username || '未知用户'
          },
          category: {
            name: post.categories?.name || '未分类'
          },
          status: post.status || 'active',
          created_at: post.created_at
        })) || []
        
        setPosts(formattedPosts)
      } else {
        const { data, error } = await supabase
          .from('replies')
          .select(`
            id,
            content,
            status,
            created_at,
            author_id,
            post_id,
            users(username),
            posts(title)
          `)
          .order('created_at', { ascending: false })
        
        if (error) {
          throw new Error(error.message)
        }
        
        // 格式化数据
        const formattedReplies = data?.map(reply => ({
          id: reply.id,
          content: reply.content,
          author: {
            username: reply.users?.username || '未知用户'
          },
          post: {
            title: reply.posts?.title || '未知帖子'
          },
          status: reply.status || 'active',
          created_at: reply.created_at
        })) || []
        
        setReplies(formattedReplies)
      }
    } catch (err) {
      setError((err as Error).message || '获取内容失败')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const handleDeletePost = async (id: number) => {
    if (!confirm('确定要删除这个帖子吗？此操作不可恢复。')) {
      return
    }
    
    try {
      // 删除帖子的所有回复
      await supabase
        .from('replies')
        .delete()
        .eq('post_id', id)
      
      // 删除帖子
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      fetchContent()
    } catch (err) {
      setError((err as Error).message || '删除帖子失败')
    }
  }

  const handleDeleteReply = async (id: number) => {
    if (!confirm('确定要删除这个回复吗？此操作不可恢复。')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('replies')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      fetchContent()
    } catch (err) {
      setError((err as Error).message || '删除回复失败')
    }
  }

  const handleTogglePostStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active'
      const { error } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      fetchContent()
    } catch (err) {
      setError((err as Error).message || '更新帖子状态失败')
    }
  }

  const handleToggleReplyStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active'
      const { error } = await supabase
        .from('replies')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      fetchContent()
    } catch (err) {
      setError((err as Error).message || '更新回复状态失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
                <h1 className="text-xl font-bold">管理员面板 - 内容管理</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">内容管理</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`${
                  activeTab === 'posts'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                帖子
              </button>
              <button
                onClick={() => setActiveTab('replies')}
                className={`${
                  activeTab === 'replies'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                回复
              </button>
            </nav>
          </div>

          {activeTab === 'posts' ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      标题
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作者
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发布时间
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{post.content.substring(0, 100)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.author.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          post.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {post.status === 'active' ? '正常' : '封禁'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/posts/${post.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleTogglePostStatus(post.id, post.status)}
                          className={`mr-3 ${
                            post.status === 'active' 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {post.status === 'active' ? '封禁' : '解封'}
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      回复内容
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作者
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      所属帖子
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      回复时间
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {replies.map((reply) => (
                    <tr key={reply.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 line-clamp-2">{reply.content}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reply.author.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {reply.post.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reply.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reply.status === 'active' ? '正常' : '封禁'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/posts/${reply.post_id}`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleToggleReplyStatus(reply.id, reply.status)}
                          className={`mr-3 ${
                            reply.status === 'active' 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {reply.status === 'active' ? '封禁' : '解封'}
                        </button>
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}