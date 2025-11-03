import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/app/lib/db';
import { encryptPassword, decryptPassword } from '@/app/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const pool = getConnection();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = 'SELECT id, site, username, password, website, category, notes, created_at, updated_at FROM passwords';
    let params: any[] = [];

    if (search) {
      query += ' WHERE site LIKE ? OR username LIKE ? OR category LIKE ? OR notes LIKE ? OR website LIKE ?';
      const searchPattern = `%${search}%`;
      params = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
    } else if (category && category !== 'All Items') {
      if (category === 'Uncategorized') {
        query += ' WHERE category = ? OR category IS NULL OR category = ""';
      } else {
        query += ' WHERE category = ?';
      }
      params = [category];
    }

    query += ' ORDER BY site ASC, username ASC';

    const [rows] = await pool.query(query, params);
    
    // Return without decryption - decryption will happen on client side after verifying master password
    return NextResponse.json({ success: true, passwords: rows });
  } catch (error: any) {
    console.error('Error fetching passwords:', error);
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
    const { site, username, password, website, category, notes, masterPassword, salt } = body;

    if (!masterPassword || !salt) {
      return NextResponse.json(
        { success: false, error: 'Master password required for encryption' },
        { status: 400 }
      );
    }

    const encryptedPassword = encryptPassword(password, masterPassword, salt);

    const [result]: any = await pool.query(
      `INSERT INTO passwords (site, username, password, website, category, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [site, username, encryptedPassword, website || null, category || 'Uncategorized', notes || null]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Password added successfully' 
    });
  } catch (error: any) {
    console.error('Error adding password:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, error: 'Password entry already exists' },
        { status: 409 }
      );
    }
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
    const { id, site, username, password, website, category, notes, masterPassword, salt } = body;

    if (!masterPassword || !salt) {
      return NextResponse.json(
        { success: false, error: 'Master password required for encryption' },
        { status: 400 }
      );
    }

    const encryptedPassword = encryptPassword(password, masterPassword, salt);

    const [result]: any = await pool.query(
      `UPDATE passwords 
       SET site = ?, username = ?, password = ?, website = ?, category = ?, notes = ?
       WHERE id = ?`,
      [site, username, encryptedPassword, website || null, category || 'Uncategorized', notes || null, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Password entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pool = getConnection();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Password ID required' },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query('DELETE FROM passwords WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Password entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Password deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting password:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

