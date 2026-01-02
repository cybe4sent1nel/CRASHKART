import { prisma } from '@/lib/prisma'

/**
 * Check if a user is an admin by their email
 * @param {string} email - User email to check
 * @returns {Promise<boolean>} - True if user is admin
 */
export async function isAdmin(email) {
  if (!email) return false
  
  try {
    const admin = await prisma.admin.findUnique({
      where: { email }
    })
    return !!admin
  } catch (error) {
    console.error('Error checking admin status:', error)
    // Return false on error (including build-time errors)
    return false
  }
}

/**
 * Get admin details by email
 * @param {string} email - Admin email
 * @returns {Promise<Object|null>} - Admin object or null
 */
export async function getAdmin(email) {
  if (!email) return null
  
  try {
    return await prisma.admin.findUnique({
      where: { email }
    })
  } catch (error) {
    console.error('Error fetching admin:', error)
    return null
  }
}
