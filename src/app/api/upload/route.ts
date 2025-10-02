import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'

// 文件上传API
export async function POST(request: NextRequest) {
  console.log('[Upload API] 文件上传请求开始')
  
  try {
    // 检查请求头
    const contentType = request.headers.get('content-type')
    console.log('[Upload API] Content-Type:', contentType)
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      console.error('[Upload API] 无效的Content-Type:', contentType)
      return NextResponse.json({ 
        error: '无效的请求格式',
        details: '请使用multipart/form-data格式'
      }, { status: 400 })
    }
    
    // 解析formData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'image'
    
    console.log('[Upload API] 接收到的文件信息:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      uploadType: type
    })
    
    // 验证文件
    if (!file) {
      console.error('[Upload API] 没有文件')
      return NextResponse.json({ 
        error: '没有文件',
        details: '请选择一个文件上传'
      }, { status: 400 })
    }
    
    if (file.size === 0) {
      console.error('[Upload API] 文件大小为0')
      return NextResponse.json({ 
        error: '文件为空',
        details: '文件大小不能为0'
      }, { status: 400 })
    }
    
    // 验证文件大小限制
    const maxSize = type === 'audio' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.error('[Upload API] 文件大小超过限制:', {
        fileSize: file.size,
        maxSize: maxSize,
        type: type
      })
      return NextResponse.json({ 
        error: '文件太大',
        details: `文件大小不能超过${maxSize / 1024 / 1024}MB`
      }, { status: 400 })
    }
    
    // 验证文件类型
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
    
    if (type === 'image' && !validImageTypes.includes(file.type)) {
      console.error('[Upload API] 无效的图片类型:', file.type)
      return NextResponse.json({ 
        error: '无效的文件类型',
        details: '请选择有效的图片文件 (JPEG, PNG, GIF, WebP)'
      }, { status: 400 })
    }
    
    if (type === 'audio' && !validAudioTypes.includes(file.type)) {
      console.error('[Upload API] 无效的音频类型:', file.type)
      return NextResponse.json({ 
        error: '无效的文件类型',
        details: '请选择有效的音频文件 (MP3, WAV, OGG, M4A)'
      }, { status: 400 })
    }
    
    // 生成文件名和路径
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    // 根据文件类型确定存储文件夹
    const folder = type === 'audio' ? 'music' : 'photo'
    const filePath = `${folder}/${fileName}`
    
    console.log('[Upload API] 开始上传文件到Supabase:', {
      filePath: filePath,
      bucket: 'files'
    })
    
    // 上传到Supabase
    const { error: uploadError } = await supabaseServer.storage
      .from('files')
      .upload(filePath, file)
    
    if (uploadError) {
      console.error('[Upload API] Supabase上传错误:', {
        message: uploadError.message
      })
      return NextResponse.json({ 
        error: '上传失败',
        details: uploadError.message
      }, { status: 500 })
    }
    
    console.log('[Upload API] 文件上传成功')
    
    // 获取公共URL
    const { data } = supabaseServer.storage
      .from('files')
      .getPublicUrl(filePath)
    
    // 将链接前缀替换为环境变量中的自定义域名
    const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://ph.20204.xyz'
    const customUrl = data.publicUrl.replace(
      /^https:\/\/[^\/]+\/storage\/v1\/object\/public/,
      storageUrl
    )
    
    console.log('[Upload API] 文件URL:', customUrl)
    
    return NextResponse.json({ 
      success: true,
      url: customUrl,
      path: filePath,
      type: type
    }, { status: 201 })
    
  } catch (error) {
    console.error('[Upload API] 未预期的错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '上传失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 获取上传配置信息
export async function GET() {
  console.log('[Upload API] 获取上传配置')
  
  try {
    const config = {
      maxImageSize: 5 * 1024 * 1024, // 5MB
      maxAudioSize: 10 * 1024 * 1024, // 10MB
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
      storageUrl: process.env.NEXT_PUBLIC_STORAGE_URL || 'https://ph.20204.xyz'
    }
    
    console.log('[Upload API] 配置信息:', config)
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('[Upload API] 获取配置错误:', error)
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 })
  }
}