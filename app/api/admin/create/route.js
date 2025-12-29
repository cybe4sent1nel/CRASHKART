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

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isAdmin: true,
                isProfileSetup: true
            }
        })

        return NextResponse.json(
            { 
                message: "Admin created successfully",
                user: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email
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
