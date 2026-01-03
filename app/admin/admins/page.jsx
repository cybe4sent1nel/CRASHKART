'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AdminManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Check if current user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (status === 'loading') return
      
      if (!session?.user?.email) {
        router.push('/admin/login')
        return
      }

      try {
        const res = await fetch('/api/admin/admins', {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          setAdmins(data.admins)
          setIsAdmin(true)
        } else {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Error checking admin:', error)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [session, status, router])

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setAddingAdmin(true)

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          name: newAdminName || null
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Admin added successfully!' })
        setNewAdminEmail('')
        setNewAdminName('')
        // Refresh admins list
        const refreshRes = await fetch('/api/admin/admins', {
          credentials: 'include'
        })
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          setAdmins(refreshData.admins)
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add admin' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while adding admin' })
      console.error('Error adding admin:', error)
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (!confirm(`Are you sure you want to remove ${adminEmail} as an admin?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Admin removed successfully!' })
        setAdmins(admins.filter(admin => admin.id !== adminId))
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to remove admin' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while removing admin' })
      console.error('Error removing admin:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 text-purple-600 hover:text-purple-700 flex items-center gap-2 transition-colors"
          >
            <span>←</span> Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Management</h1>
          <p className="text-gray-600">Manage admin users who can access the admin panel</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Add Admin Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add New Admin</h2>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Admin Name"
              />
            </div>
            <button
              type="submit"
              disabled={addingAdmin}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingAdmin ? 'Adding...' : 'Add Admin'}
            </button>
          </form>
        </div>

        {/* Admins List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Current Admins</h2>
          {admins.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No admins found</p>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-gray-800">{admin.email}</div>
                    {admin.name && (
                      <div className="text-sm text-gray-600">{admin.name}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Added: {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {admin.email !== session?.user?.email && (
                    <button
                      onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  {admin.email === session?.user?.email && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Admin Management Info</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Only existing admins can add new admins</li>
            <li>• You cannot remove your own admin account</li>
            <li>• Admins have full access to the admin panel</li>
            <li>• The initial admin (crashkart.help@gmail.com) was added during database setup</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
