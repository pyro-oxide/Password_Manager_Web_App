import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { getConnection } from '@/app/lib/db';

export async function POST() {
  try {
    const pool = getConnection();
    
    // Generate a secret
    const secret = speakeasy.generateSecret({
      name: 'Password Manager Web App',
      length: 32,
    });

    // Generate QR code data URL
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: 'Password Manager',
      issuer: 'Password Manager Web App',
      encoding: 'base32',
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store the secret temporarily (we'll save it after verification)
    // For now, we'll return it and the frontend will send it back for verification
    
    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      manualEntryKey: secret.base32,
    });
  } catch (error: any) {
    console.error('Error generating 2FA secret:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

