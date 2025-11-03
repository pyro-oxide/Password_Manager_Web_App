import { NextResponse } from 'next/server';
import { getConnection } from '@/app/lib/db';

export async function GET() {
  try {
    const pool = getConnection();
    const [rows]: any = await pool.query(
      `SELECT DISTINCT category FROM passwords
       WHERE category IS NOT NULL AND category != ''
       ORDER BY category ASC`
    );

    const categories = rows.map((row: any) => row.category);

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

