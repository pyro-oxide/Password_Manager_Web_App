import { NextResponse } from 'next/server';
import { ensureDatabaseExists, initializeTables } from '@/app/lib/db';

export async function GET() {
  try {
    await ensureDatabaseExists();
    await initializeTables();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

