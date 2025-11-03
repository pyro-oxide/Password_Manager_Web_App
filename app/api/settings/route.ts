import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    const pool = getConnection();
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (key) {
      const [rows]: any = await pool.query(
        'SELECT `value` FROM settings WHERE `key` = ?',
        [key]
      );

      if (rows.length === 0) {
        return NextResponse.json({ success: true, value: null });
      }

      return NextResponse.json({ success: true, value: rows[0].value });
    } else {
      const [rows]: any = await pool.query('SELECT `key`, `value` FROM settings');
      const settings: Record<string, string> = {};
      rows.forEach((row: any) => {
        settings[row.key] = row.value;
      });
      return NextResponse.json({ success: true, settings });
    }
  } catch (error: any) {
    console.error('Error fetching settings:', error);
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
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Setting key required' },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE \`value\`=VALUES(\`value\`)`,
      [key, value]
    );

    return NextResponse.json({ success: true, message: 'Setting saved successfully' });
  } catch (error: any) {
    console.error('Error saving setting:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

