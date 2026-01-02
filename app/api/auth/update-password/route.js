import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireUser } from '@/lib/authTokens'
import { passwordIssues } from '@/lib/passwordPolicy'
import { sendPasswordChangedEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const { oldPassword, newPassword, confirmPassword } = await request.json()

        if (!newPassword || !confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'New password and confirmation are required' },
                { status: 400 }
            )
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ success: false, error: 'Passwords do not match' }, { status: 400 })
        }

        const issues = passwordIssues(newPassword)
        if (issues.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Password does not meet requirements', issues },
                { status: 400 }
            )
        }

        const { user } = await requireUser(request)

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { password: true, email: true, name: true }
        })

        if (!dbUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        if (dbUser.password) {
            if (!oldPassword) {
                return NextResponse.json({ success: false, error: 'Current password is required' }, { status: 400 })
            }

            const matches = await bcrypt.compare(oldPassword, dbUser.password)
            if (!matches) {
                return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 })
            }

            const isSame = await bcrypt.compare(newPassword, dbUser.password)
            if (isSame) {
                return NextResponse.json({ success: false, error: 'New password must be different from current password' }, { status: 400 })
            }
        }

        const hashed = await bcrypt.hash(newPassword, 12)

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                loginMethod: 'password'
            },
            select: { email: true, name: true }
        })

        try {
            await sendPasswordChangedEmail(updated.email, updated.name || 'User')
        } catch (err) {
            console.warn('Password change email failed:', err?.message || err)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error.name === 'AuthError') {
            return NextResponse.json({ success: false, error: error.message }, { status: error.status })
        }

        console.error('Update password error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 })
    }
}
