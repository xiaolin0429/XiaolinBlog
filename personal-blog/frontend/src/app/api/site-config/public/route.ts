import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/site-config/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // 确保获取最新数据
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('获取公开配置失败:', error)
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    )
  }
}