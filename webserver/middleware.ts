import { NextRequest, NextResponse } from 'next/server'

/**
 * Disallow any request from /api/ when the flask API server is down.
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'
  const apiPath = request.nextUrl.pathname.replace('/api/', '')

  try {
    const response = await fetch(`${apiUrl}/api/${apiPath}`, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'POST' ? request.body : undefined,
    })

    if (response.ok) {
      return NextResponse.rewrite(`${apiUrl}/api/${apiPath}`)
    }
  } catch (error) {
    console.error('Failed to connect to Flask API:', error)
  }

  return new Response('Flask API is currently unavailable', { status: 503 })
}
