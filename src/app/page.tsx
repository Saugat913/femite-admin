'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard - middleware will handle auth
    router.push('/dashboard')
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Femite Admin</h1>
        <p className="text-gray-600 mb-4">Hemp Fashion Administration</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
      </div>
    </div>
  )
}
