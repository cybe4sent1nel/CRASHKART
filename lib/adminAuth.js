import { prisma } from '@/lib/prisma'

/**
 * Get list of super admin emails from environment variables
 * Supports MAIN_ADMIN_EMAIL, ADMIN_EMAIL_1, ADMIN_EMAIL_2
 * @returns {string[]} - Array of admin emails
 */
export function getSuperAdminEmails() {
  const emails = []
  
  // Primary admin email
  if (process.env.MAIN_ADMIN_EMAIL) {
    emails.push(process.env.MAIN_ADMIN_EMAIL)
  }
  
  // Additional admin emails from env
  if (process.env.ADMIN_EMAIL_1) {
    emails.push(process.env.ADMIN_EMAIL_1)
  }
  
  if (process.env.ADMIN_EMAIL_2) {
    emails.push(process.env.ADMIN_EMAIL_2)
  }
  
  // Fallback email if none configured
  if (emails.length === 0) {
    emails.push('crashkart.help@gmail.com')
  }
  
  return emails
}

/**
 * Check if an email is a super admin (from environment variables)
 * @param {string} email - Email to check
 * @returns {boolean} - True if email is a super admin
 */
export function isSuperAdmin(email) {
  if (!email) return false
  const superAdmins = getSuperAdminEmails()
  return superAdmins.includes(email.toLowerCase())
}

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
