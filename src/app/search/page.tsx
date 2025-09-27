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

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    try {
      // 这里应该调用实际的搜索API
      // 目前我们模拟搜索结果
      const response = await fetch('/api/posts')
      if (!response.ok) {
        throw new Error('搜索失败')
      }
      const allPosts: Post[] = await response.json()
      // 模拟搜索逻辑：查找标题或内容中包含查询词的帖子
      const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.content.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filteredPosts)
    } catch (error) {
      console.error('搜索时出错:', error)
    } finally {
      setLoading(false)
    }
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
                <button 
                  onClick={() => router.push('/')}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  首页
                </button>
                <button className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  搜索
                </button>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">搜索帖子</h1>
          <p className="mt-2 text-gray-600">查找您感兴趣的内容</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入搜索关键词..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-r-lg"
              >
                搜索
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {results.length > 0 ? (
              results.map((post) => (
                <div key={post.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-xl font-semibold">
                      <button 
                        onClick={() => router.push(`/posts/${post.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {post.title}
                      </button>
                    </h2>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <p className="text-gray-600">{post.content.substring(0, 200)}...</p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>作者: {post.author.username}</span>
                      <span>分类: {post.category.name}</span>
                      <span>回复: {post.replies.length}</span>
                      <span>发布于: {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : query ? (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium text-gray-900">没有找到相关帖子</h2>
                  <p className="mt-1 text-sm text-gray-500">请尝试使用不同的关键词进行搜索</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}