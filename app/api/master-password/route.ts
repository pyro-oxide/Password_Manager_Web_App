import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/app/lib/db';
import { hashPassword, verifyPassword } from '@/app/lib/encryption';

export async function GET() {
  try {
    const pool = getConnection();
    const [rows]: any = await pool.query(
      'SELECT hash, salt FROM master_password WHERE id = 1'
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: true, exists: false });
    }

    // Handle salt conversion - it might be a Buffer or already a string
    let saltHex: string;
    if (Buffer.isBuffer(rows[0].salt)) {
      saltHex = rows[0].salt.toString('hex');
    } else if (typeof rows[0].salt === 'string') {
      saltHex = rows[0].salt;
    } else {
      saltHex = Buffer.from(rows[0].salt).toString('hex');
    }

    return NextResponse.json({ 
      success: true, 
      exists: true,
      hash: rows[0].hash,
      salt: saltHex
    });
  } catch (error: any) {
    console.error('Error fetching master password:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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

    const { hash, salt } = hashPassword(password);

    await pool.query(
      `INSERT INTO master_password (id, hash, salt, created_at)
       VALUES (1, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE hash=VALUES(hash), salt=VALUES(salt), created_at=CURRENT_TIMESTAMP`,
      [hash, Buffer.from(salt, 'hex')]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Master password set successfully',
      salt 
    });
  } catch (error: any) {
    console.error('Error setting master password:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const pool = getConnection();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Verify current password
    const [rows]: any = await pool.query(
      'SELECT hash, salt FROM master_password WHERE id = 1'
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Master password not set' },
        { status: 404 }
      );
    }

    const isValid = verifyPassword(
      currentPassword, 
      rows[0].hash, 
      rows[0].salt.toString('hex')
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Set new password
    const { hash, salt } = hashPassword(newPassword);

    await pool.query(
      `UPDATE master_password SET hash = ?, salt = ?, created_at = CURRENT_TIMESTAMP WHERE id = 1`,
      [hash, Buffer.from(salt, 'hex')]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Master password updated successfully',
      salt 
    });
  } catch (error: any) {
    console.error('Error updating master password:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pool = getConnection();
    const body = await request.json();
    const { password } = body;

    // Verify password before allowing deletion
    const [rows]: any = await pool.query(
      'SELECT hash, salt FROM master_password WHERE id = 1'
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Master password not set' },
        { status: 404 }
      );
    }

    const isValid = verifyPassword(
      password, 
      rows[0].hash, 
      rows[0].salt.toString('hex')
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    await pool.query('DELETE FROM master_password WHERE id = 1');

    return NextResponse.json({ 
      success: true, 
      message: 'Master password deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting master password:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

