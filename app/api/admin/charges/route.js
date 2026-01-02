import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'adminCharges.json')

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    let data = JSON.parse(raw)
    // Ensure backwards compatibility: if data is flat, wrap into structure
    if (!data.rules) {
      data = { global: { shippingFee: data.shippingFee ?? 0, freeAbove: data.freeAbove ?? 0, convenienceFee: data.convenienceFee ?? 0, platformFee: data.platformFee ?? 0 }, rules: [] }
    }
    return NextResponse.json({ success: true, charges: data })
  } catch (err) {
    console.error('Failed to read admin charges:', err.message)
    return NextResponse.json({ success: false, message: 'Failed to read charges' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    // Allow either flat body or a structured { global, rules }
    const toWrite = body.rules ? body : {
      global: {
        shippingFee: Number(body.shippingFee || 0),
        freeAbove: Number(body.freeAbove || 0),
        convenienceFee: Number(body.convenienceFee || 0),
        platformFee: Number(body.platformFee || 0)
      },
      rules: []
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(toWrite, null, 2), 'utf8')
    return NextResponse.json({ success: true, charges: toWrite })
  } catch (err) {
    console.error('Failed to write admin charges:', err.message)
    return NextResponse.json({ success: false, message: 'Failed to save charges' }, { status: 500 })
  }
}
