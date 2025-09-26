'use client'

import { FileText, Eye, Edit, Calendar } from 'lucide-react'

interface BlogStatsData {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  newThisMonth: number
  totalCategories: number
}

interface BlogStatsProps {
  stats: BlogStatsData
}

export default function BlogStats({ stats }: BlogStatsProps) {
  const statItems = [
    {
      name: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Published',
      value: stats.publishedPosts,
      icon: Eye,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'Drafts',
      value: stats.draftPosts,
      icon: Edit,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      name: 'This Month',
      value: stats.newThisMonth,
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.name} className={`${item.bgColor} overflow-hidden rounded-lg border border-gray-200`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${item.color} rounded-md flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd>
                      <div className={`text-lg font-medium ${item.textColor}`}>
                        {item.value.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}