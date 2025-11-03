import { NextRequest, NextResponse } from 'next/server';
import { decryptPassword } from '@/app/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { encryptedPassword, masterPassword, salt } = body;

    if (!encryptedPassword || !masterPassword || !salt) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const decryptedPassword = decryptPassword(encryptedPassword, masterPassword, salt);

    return NextResponse.json({ 
      success: true, 
      password: decryptedPassword 
    });
  } catch (error: any) {
    console.error('Error decrypting password:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Decryption failed' },
      { status: 500 }
    );
  }
}

