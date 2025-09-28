'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ReactMarkdown from 'react-markdown'

export default function CreatePostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 获取分类列表
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
        
        if (error) {
          throw new Error(error.message)
        }
        
        setCategories(data || [])
        if (data && data.length > 0) {
          setCategoryId(data[0].id.toString())
        }
      } catch (err) {
        console.error('获取分类失败:', err)
        setError('获取分类失败')
      }
    }

    fetchCategories()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) { // 5MB限制
        setError('图片大小不能超过5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError('请选择有效的图片文件')
        return
      }
      
      setImageFile(file)
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) { // 10MB限制
        setError('音频文件大小不能超过10MB')
        return
      }
      
      if (!file.type.startsWith('audio/')) {
        setError('请选择有效的音频文件')
        return
      }
      
      setAudioFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 获取当前用户信息
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('请先登录')
      }

      const userId = session.user.id

      // 准备帖子内容
      let finalContent = content;

      // 上传图片文件
      if (imageFile) {
        try {
          const fileExt = imageFile.name.split('.').pop()
          const fileName = `${Date.now()}_${Math.random()}.${fileExt}`
          const filePath = `images/${fileName}`
          
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(filePath, imageFile)
            
          if (uploadError) {
            throw new Error('图片上传失败: ' + uploadError.message)
          }
          
          // 获取公共URL
          const { data } = supabase.storage
            .from('files')
            .getPublicUrl(filePath)
            
          // 将链接前缀替换为环境变量中的自定义域名
          const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://ph.20204.xyz'
          const customUrl = data.publicUrl.replace(
            /^https:\/\/[^\/]+\/storage\/v1\/object\/public/,
            storageUrl
          )
            
          // 在内容中添加图片链接
          finalContent = `${finalContent}\n\n![图片](${customUrl})`
        } catch (uploadErr) {
          throw new Error('图片上传失败: ' + (uploadErr as Error).message)
        }
      }

      // 上传音频文件
      if (audioFile) {
        try {
          const fileExt = audioFile.name.split('.').pop()
          const fileName = `${Date.now()}_${Math.random()}.${fileExt}`
          const filePath = `audio/${fileName}`
          
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(filePath, audioFile)
            
          if (uploadError) {
            throw new Error('音频上传失败: ' + uploadError.message)
          }
          
          // 获取公共URL
          const { data } = supabase.storage
            .from('files')
            .getPublicUrl(filePath)
            
          // 将链接前缀替换为环境变量中的自定义域名
          const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://ph.20204.xyz'
          const customUrl = data.publicUrl.replace(
            /^https:\/\/[^\/]+\/storage\/v1\/object\/public/,
            storageUrl
          )
            
          // 在内容中添加音频链接
          finalContent = `${finalContent}\n\n[音频文件](${customUrl})`
        } catch (uploadErr) {
          throw new Error('音频上传失败: ' + (uploadErr as Error).message)
        }
      }

      // 创建帖子
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title,
          content: finalContent,
          author_id: userId,
          category_id: parseInt(categoryId)
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // 成功后跳转到新创建的帖子页面
      router.push(`/posts/${data.id}`)
      router.refresh()
    } catch (err) {
      console.error('发布帖子失败:', err)
      setError((err as Error).message || '发布帖子失败')
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
        <div className="max-w-2xl mx-auto">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">发布新帖子</h1>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    标题
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    placeholder="输入帖子标题"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    分类
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      内容
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsPreview(false)}
                        className={`px-3 py-1 text-sm rounded ${!isPreview ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPreview(true)}
                        className={`px-3 py-1 text-sm rounded ${isPreview ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        预览
                      </button>
                    </div>
                  </div>
                  
                  {isPreview ? (
                    <div className="border border-gray-300 rounded-md p-3 min-h-[200px]">
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                      placeholder="输入帖子内容，支持Markdown语法..."
                      required
                    />
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    支持Markdown语法：**粗体** *斜体* `代码` # 标题 ## 子标题
                    [链接](url) ![图片](url)
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    上传图片
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  {imagePreview && (
                    <div className="mt-2">
                      <img src={imagePreview} alt="预览" className="max-h-40 rounded" />
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    上传音频
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  {audioFile && (
                    <div className="mt-2 text-sm text-gray-500">
                      已选择音频文件: {audioFile.name}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {loading ? '发布中...' : '发布帖子'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}