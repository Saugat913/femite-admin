'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Tags, 
  BarChart3, 
  Mail, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Leaf,
  ExternalLink,
  FileText
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import SessionNotification from './SessionNotification'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/users', icon: Users },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Blog', href: '/blog', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Newsletter', href: '/newsletter', icon: Mail },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user, isLoading } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  // Show loading state while authentication is being checked
  if (isLoading) {
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

  const isActive = (href: string) => pathname === href

  return (
    <div className="h-full bg-white">
      <SessionNotification />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          
          {/* Mobile sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <SidebarContent 
              navigation={navigation} 
              isActive={isActive} 
              onLogout={handleLogout} 
            />
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <SidebarContent 
          navigation={navigation} 
          isActive={isActive} 
          onLogout={handleLogout} 
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-black">
                {navigation.find(item => isActive(item.href))?.name || 'Admin Panel'}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center space-x-4">
              {/* View Main Site Link */}
              <a
                href={process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black flex items-center space-x-1 text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Site</span>
              </a>

              {/* User menu */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-black">Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: typeof navigation
  isActive: (href: string) => boolean
  onLogout: () => void
}

function SidebarContent({ navigation, isActive, onLogout }: SidebarContentProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-6">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mr-3">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-black">Femite Admin</h2>
            <p className="text-xs text-gray-600">Hemp Fashion</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-black text-white border-r-4 border-black'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-l-md transition-colors`}
              >
                <Icon
                  className={`${
                    isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-black'
                  } mr-3 flex-shrink-0 h-6 w-6 transition-colors`}
                />
                {item.name}
              </a>
            )
          })}
        </nav>
      </div>
      
      {/* Logout button */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 w-full transition-colors"
        >
          <LogOut className="text-red-400 group-hover:text-red-500 mr-3 flex-shrink-0 h-6 w-6" />
          Sign out
        </button>
      </div>
    </div>
  )
}