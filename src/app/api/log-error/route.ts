import { NextRequest, NextResponse } from 'next/server'

// 客户端错误日志API
export async function POST(request: NextRequest) {
  console.log('[Log Error API] 接收到客户端错误')
  
  try {
    const { error, context, timestamp, userAgent, url } = await request.json()
    
    console.error(`[Client Error - ${context}] ${error}`, {
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || 'Unknown',
      url: url || 'Unknown',
      errorDetails: error
    })
    
    return NextResponse.json({ 
      logged: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Log Error API] 无法记录错误:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: '日志记录失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}