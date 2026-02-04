import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { getConnection } from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    const pool = getConnection();
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get the 2FA secret from database
    const [secretRows]: any = await pool.query(
      'SELECT `value` FROM settings WHERE `key` = ?',
      ['twoFactorSecret']
    );

    if (secretRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '2FA secret not found',
      });
    }

    const secret = secretRows[0].value;

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });

    if (verified) {
      return NextResponse.json({
        success: true,
        verified: true,
      });
    } else {
      return NextResponse.json({
        success: true,
        verified: false,
        error: 'Invalid verification code',
      });
    }
  } catch (error: any) {
    console.error('Error verifying 2FA token for login:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

