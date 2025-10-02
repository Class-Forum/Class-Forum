'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function UserSettingsPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [notification, setNotification] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUsername(user.user_metadata?.full_name || '')
          setEmail(user.email || '')
          
          // 获取用户头像
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('avatar')
            .eq('id', user.id)
            .single()
          
          if (!userError && userData?.avatar) {
            setAvatar(userData.avatar)
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [router])

  // 处理头像文件选择
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // 验证文件类型和大小
      if (!file.type.startsWith('image/')) {
        setErrorMessage('请选择有效的图片文件')
        return
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB限制
        setErrorMessage('图片大小不能超过2MB')
        return
      }
      
      setAvatarFile(file)
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 上传头像
  const uploadAvatar = async () => {
    if (!avatarFile) return
    
    setUploadingAvatar(true)
    setErrorMessage('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`
      
      // 上传到Supabase
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, avatarFile)
        
      if (uploadError) {
        throw new Error('头像上传失败: ' + uploadError.message)
      }
      
      // 获取公共URL
      const { data } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)
      
      // 优先使用原始URL
      let avatarUrl = data.publicUrl
      
      // 如果配置了自定义域名，尝试替换
      const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL
      if (storageUrl) {
        avatarUrl = data.publicUrl.replace(
          /^https:\/\/[^\/]+\/storage\/v1\/object\/public/,
          storageUrl
        )
      }
      
      // 更新用户头像
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar: avatarUrl })
        .eq('id', user.id)
        
      if (updateError) {
        throw new Error('更新头像失败: ' + updateError.message)
      }
      
      setAvatar(avatarUrl)
      setAvatarFile(null)
      setAvatarPreview('')
      setSuccessMessage('头像上传成功')
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (err) {
      setErrorMessage((err as Error).message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: username
        }
      })
      
      if (error) {
        setErrorMessage(error.message)
      } else {
        setSuccessMessage('个人信息已更新')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (_error) {
      setErrorMessage('更新个人信息时出错')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('新密码和确认密码不匹配')
      return
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        setErrorMessage(error.message)
      } else {
        setSuccessMessage('密码已更改')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (_error) {
      setErrorMessage('更改密码时出错')
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
                  <h1 className="text-xl font-bold">用户设置</h1>
                </div>
              </div>
              <div className="flex items-center">
                <div className="animate-pulse bg-gray-200 rounded h-8 w-20"></div>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
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
                <h1 className="text-xl font-bold">用户设置</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">个人信息</h3>
                <p className="mt-1 text-sm text-gray-600">
                  更新您的个人信息和账户设置。
                </p>
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                      {successMessage}
                    </div>
                  )}
                  
                  {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {errorMessage}
                    </div>
                  )}
                  
                  {/* 头像上传 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      头像
                    </label>
                    <div className="mt-1 flex items-center">
                      <div className="relative">
                        <img 
                          src={avatarPreview || avatar || '/default-avatar.png'} 
                          alt="用户头像"
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="text-sm text-gray-500"
                        />
                        {avatarFile && (
                          <button
                            type="button"
                            onClick={uploadAvatar}
                            disabled={uploadingAvatar}
                            className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {uploadingAvatar ? '上传中...' : '上传头像'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      用户名
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      电子邮件
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border bg-gray-100"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      邮箱地址无法在此更改，请联系管理员。
                    </p>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="notifications"
                        name="notifications"
                        type="checkbox"
                        checked={notification}
                        onChange={(e) => setNotification(e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="notifications" className="font-medium text-gray-700">
                        邮件通知
                      </label>
                      <p className="text-gray-500">
                        接收重要更新和通知的电子邮件。
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    onClick={handleProfileUpdate}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200"></div>
            </div>
          </div>
          
          <div className="mt-10 sm:mt-0">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">更改密码</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    更新您的账户密码。
                  </p>
                </div>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                        新密码
                      </label>
                      <input
                        type="password"
                        name="new-password"
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                        确认新密码
                      </label>
                      <input
                        type="password"
                        name="confirm-password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      onClick={handleChangePassword}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      更改密码
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}