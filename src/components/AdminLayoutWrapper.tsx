'use client'

import { usePathname } from 'next/navigation'
import AdminLayout from './AdminLayout'
import { AuthProvider } from '@/lib/auth-context'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname()
  
  // Don't wrap login page with AdminLayout
  const isLoginPage = pathname === '/login'
  
  return (
    <AuthProvider>
      {isLoginPage ? (
        children
      ) : (
        <AdminLayout>
          {children}
        </AdminLayout>
      )}
    </AuthProvider>
  )
}
