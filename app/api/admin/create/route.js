import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {
        const { name, email, password } = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user account first
        const user = await prisma.user.create({
            data: {
                id: require('crypto').randomUUID(),
                name,
                email,
                password: hashedPassword,
                isProfileSetup: true
            }
        })

        // Create admin record
        await prisma.admin.create({
            data: {
                email: user.email,
                name: user.name,
                addedBy: null
            }
        })

        return NextResponse.json(
            { 
                message: "Admin created successfully",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Admin creation error:", error)
        return NextResponse.json(
            { error: "Failed to create admin" },
            { status: 500 }
        )
    }
}
