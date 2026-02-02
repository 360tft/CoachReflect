import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not logged in or not admin
  if (!user || !isAdminUser(user.email, user.id)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-primary">
                Coach Reflection Admin
              </Link>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary"
              >
                Back to App
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-48 flex-shrink-0">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  Users
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/feedback"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/analytics"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/limits"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  Usage Limits
                </Link>
              </li>
            </ul>

            {/* Marketing Section */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Marketing
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/admin/engagement"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Engagement
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/recovery"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Recovery
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/content"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Content Mining
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/seo"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  >
                    SEO Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/blog"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
