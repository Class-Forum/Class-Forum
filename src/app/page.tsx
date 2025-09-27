'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  replies: {
    id: number
  }[]
  created_at: string
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 检查用户是否已登录
    const checkLoginStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    
    checkLoginStatus()
    
    const fetchPosts = async () => {
      try {
        // 从Supabase获取帖子
        const { data, error } = await supabase
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
          throw new Error(error.message)
        }
        
        // 格式化数据以匹配前端期望的结构
        const formattedPosts = data?.map(post => ({
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
        
        setPosts(formattedPosts)
      } catch (err: any) {
        console.error('获取帖子时出错:', err)
        setError(err.message || '获取帖子时出错')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('登出失败:', error)
    } else {
      setIsLoggedIn(false)
      router.push('/login')
    }
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            错误: {error}
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            前往登录页
          </button>
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
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  首页
                </Link>
                <Link href="/search" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  搜索
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {isLoggedIn ? (
                <>
                  <button 
                    onClick={() => router.push('/settings')}
                    className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    设置
                  </button>
                  <button 
                    onClick={() => router.push('/admin')}
                    className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    管理员
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    退出
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => router.push('/login')}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">最新帖子</h1>
            <p className="mt-2 text-gray-600">查看班级最新讨论</p>
          </div>
          {isLoggedIn && (
            <button 
              onClick={() => router.push('/posts/create')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              发布帖子
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-xl font-semibold">
                    <Link href={`/posts/${post.id}`} className="text-blue-500 hover:text-blue-700">
                      {post.title}
                    </Link>
                  </h2>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <p className="text-gray-600">{post.content.substring(0, 200)}...</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>作者: {post.author?.username || '未知'}</span>
                    <span>分类: {post.category?.name || '未分类'}</span>
                    <span>回复: {post.replies?.length || 0}</span>
                    <span>发布于: {new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">暂无帖子</h2>
                <p className="mt-1 text-sm text-gray-500">还没有人发布帖子，快来发布第一个帖子吧！</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}