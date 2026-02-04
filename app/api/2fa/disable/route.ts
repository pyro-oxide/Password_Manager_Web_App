import { NextResponse } from 'next/server';
import { getConnection } from '@/app/lib/db';

export async function POST() {
  try {
    const pool = getConnection();
    
    // Disable 2FA
    await pool.query(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      ['twoFactorEnabled', 'false', 'false']
    );

    // Delete the secret
    await pool.query(
      'DELETE FROM settings WHERE `key` = ?',
      ['twoFactorSecret']
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

