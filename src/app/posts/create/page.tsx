'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

export default function CreatePostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  const uploadFile = async (file: File, folder: string) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${folder}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file)
        
      if (uploadError) {
        throw new Error(uploadError.message)
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
        
      return customUrl
    } catch (err) {
      console.error('上传文件失败:', err)
      throw err
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

      // 创建帖子
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title,
          content,
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
      setError(err.message || '发布帖子失败')
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
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    内容
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    placeholder="输入帖子内容"
                    required
                  />
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
                      <Image src={imagePreview} alt="预览" width={200} height={200} className="max-h-40 rounded" />
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
                    disabled={loading || uploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {uploading ? '上传中...' : loading ? '发布中...' : '发布帖子'}
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