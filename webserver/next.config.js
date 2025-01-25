module.exports = {
  async rewrites() {
    const baseUrl =
      process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'
    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
    ]
  },
}
