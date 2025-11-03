import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/app/lib/db';
import { verifyPassword } from '@/app/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const pool = getConnection();
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password required' },
        { status: 400 }
      );
    }

    const [rows]: any = await pool.query(
      'SELECT hash, salt FROM master_password WHERE id = 1'
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Master password not set' },
        { status: 404 }
      );
    }

    // Handle salt conversion - it might be a Buffer or already a string
    let saltHex: string;
    if (Buffer.isBuffer(rows[0].salt)) {
      saltHex = rows[0].salt.toString('hex');
    } else if (typeof rows[0].salt === 'string') {
      // If it's already a hex string, use it directly
      saltHex = rows[0].salt;
    } else {
      // Fallback: convert to buffer first
      saltHex = Buffer.from(rows[0].salt).toString('hex');
    }

    // Log for debugging (remove in production)
    console.log('Verifying password:', {
      hashLength: rows[0].hash?.length,
      saltLength: saltHex?.length,
      saltType: typeof saltHex,
    });

    const isValid = verifyPassword(
      password, 
      rows[0].hash, 
      saltHex
    );

    console.log('Password verification result:', isValid);

    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        valid: true,
        salt: saltHex
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        valid: false 
      });
    }
  } catch (error: any) {
    console.error('Error verifying master password:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

