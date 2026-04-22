import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Master Admin required' }, { status: 401 });
    }

    const body = await request.json();
    const { migrationFile } = body;

    if (!migrationFile) {
      return NextResponse.json({ error: 'Migration file required' }, { status: 400 });
    }

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', migrationFile);
    
    // Security: only allow .sql files from migrations directory
    if (!migrationFile.endsWith('.sql') || !migrationPath.startsWith(path.join(process.cwd(), 'migrations'))) {
      return NextResponse.json({ error: 'Invalid migration file' }, { status: 400 });
    }

    const sql = getDb();
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = migrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message?.includes('already exists') && !error.message?.includes('already defined')) {
          throw error;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully applied migration: ${migrationFile}`,
      statementsRun: statements.length 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to run migration' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // List available migrations
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

    return NextResponse.json({ migrations: files });
  } catch (error: any) {
    console.error('Failed to list migrations:', error);
    return NextResponse.json({ error: 'Failed to list migrations' }, { status: 500 });
  }
}
