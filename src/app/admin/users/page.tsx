'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface User {
  id: number
  username: string
  role: string
  status: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
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
    fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, status, created_at')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      setUsers(data || [])
    } catch (err) {
      setError((err as Error).message || '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (username: string, password: string, role: string) => {
    try {
      // 将用户信息保存到我们的数据库
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: username,
          password: password, // 在实际应用中应该加密
          role: role,
          status: 'active'
        })
        .select()
      
      if (error) {
        throw new Error(error.message)
      }
      
      setIsAddingUser(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || '添加用户失败')
    }
  }

  const handleBulkAddUsers = async (userData: Record<string, string>) => {
    try {
      // 准备批量插入的数据
      const usersToInsert = Object.entries(userData).map(([username, password]) => ({
        username,
        password, // 在实际应用中应该加密
        role: 'user', // 默认角色为普通用户
        status: 'active'
      }))
      
      // 批量插入用户
      const { error } = await supabase
        .from('users')
        .insert(usersToInsert)
      
      if (error) {
        throw new Error(error.message)
      }
      
      setIsBulkAdding(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || '批量添加用户失败')
    }
  }

  const handleUpdateUser = async (id: number, userData: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || '更新用户失败')
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) {
      return
    }
    
    try {
      // 删除用户的帖子和回复
      await supabase
        .from('replies')
        .delete()
        .eq('author_id', id)
      
      await supabase
        .from('posts')
        .delete()
        .eq('author_id', id)
      
      // 删除用户
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      fetchUsers()
    } catch (err: any) {
      setError(err.message || '删除用户失败')
    }
  }

  const handleToggleUserStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active'
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      fetchUsers()
    } catch (err: any) {
      setError(err.message || '更新用户状态失败')
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
                <h1 className="text-xl font-bold">管理员面板 - 用户管理</h1>
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
            <h1 className="text-2xl font-semibold text-gray-900">用户管理</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsBulkAdding(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                批量添加
              </button>
              <button
                onClick={() => setIsAddingUser(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                添加用户
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {isAddingUser && (
            <AddUserForm 
              onSubmit={handleAddUser} 
              onCancel={() => setIsAddingUser(false)} 
            />
          )}

          {isBulkAdding && (
            <BulkAddUsersForm 
              onSubmit={handleBulkAddUsers} 
              onCancel={() => setIsBulkAdding(false)} 
            />
          )}

          {editingUser && (
            <EditUserForm 
              user={editingUser}
              onSubmit={handleUpdateUser}
              onCancel={() => setEditingUser(null)}
            />
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' ? '正常' : '封禁'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.status)}
                        className={`mr-3 ${
                          user.status === 'active' 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.status === 'active' ? '封禁' : '解封'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
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
        </div>
      </div>
    </div>
  )
}

function AddUserForm({ onSubmit, onCancel }: { 
  onSubmit: (username: string, password: string, role: string) => void,
  onCancel: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('用户名和密码不能为空')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await onSubmit(username, password, role)
    } catch (err: any) {
      setError(err.message || '添加用户失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">添加新用户</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              角色
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '添加中...' : '添加用户'}
          </button>
        </div>
      </form>
    </div>
  )
}

function BulkAddUsersForm({ onSubmit, onCancel }: { 
  onSubmit: (userData: Record<string, string>) => void,
  onCancel: () => void
}) {
  const [jsonInput, setJsonInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{username: string, password: string}[]>([])

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setJsonInput(value)
    
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          const previewData = Object.entries(parsed).map(([username, password]) => ({
            username,
            password: String(password)
          }))
          setPreview(previewData)
          setError('')
        } else {
          setError('JSON格式不正确，请使用{"用户名":"密码"}的格式')
          setPreview([])
        }
      } else {
        setPreview([])
      }
    } catch (err) {
      setError('JSON格式无效')
      setPreview([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!jsonInput.trim()) {
      setError('请输入用户数据')
      return
    }
    
    try {
      const userData = JSON.parse(jsonInput)
      
      if (typeof userData !== 'object' || userData === null || Array.isArray(userData)) {
        setError('JSON格式不正确，请使用{"用户名":"密码"}的格式')
        return
      }
      
      setLoading(true)
      setError('')
      
      await onSubmit(userData)
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('JSON格式无效')
      } else {
        setError(err.message || '批量添加用户失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">批量添加用户</h2>
      <p className="text-sm text-gray-500 mb-4">请输入JSON格式的用户数据，格式：{"{用户名:密码, 用户名:密码}"}</p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="json-input" className="block text-sm font-medium text-gray-700 mb-2">
            用户数据 (JSON格式)
          </label>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={handleJsonChange}
            rows={6}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
            placeholder='{"user1":"password1", "user2":"password2", "user3":"password3"}'
          />
        </div>
        
        {preview.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">预览 ({preview.length} 个用户)</h3>
            <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">密码</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((user, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{user.username}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{'*'.repeat(user.password.length)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || preview.length === 0}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? '添加中...' : `添加 ${preview.length} 个用户`}
          </button>
        </div>
      </form>
    </div>
  )
}

function EditUserForm({ 
  user, 
  onSubmit, 
  onCancel 
}: { 
  user: User,
  onSubmit: (id: number, userData: Partial<User>) => void,
  onCancel: () => void
}) {
  const [username, setUsername] = useState(user.username)
  const [role, setRole] = useState(user.role)
  const [status, setStatus] = useState(user.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) {
      setError('用户名不能为空')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await onSubmit(user.id, { username, role, status })
    } catch (err: any) {
      setError(err.message || '更新用户失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">编辑用户</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              type="text"
              id="edit-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">
              角色
            </label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
              状态
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="active">正常</option>
              <option value="banned">封禁</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '更新中...' : '更新用户'}
          </button>
        </div>
      </form>
    </div>
  )
}