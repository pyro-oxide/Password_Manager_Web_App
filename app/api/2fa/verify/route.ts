import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { getConnection } from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    const pool = getConnection();
    const body = await request.json();
    const { secret, token } = body;

    if (!secret || !token) {
      return NextResponse.json(
        { success: false, error: 'Secret and token are required' },
        { status: 400 }
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });

    if (verified) {
      // Save the secret to the database
      await pool.query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        ['twoFactorSecret', secret, secret]
      );

      // Enable 2FA
      await pool.query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        ['twoFactorEnabled', 'true', 'true']
      );

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
    console.error('Error verifying 2FA token:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

