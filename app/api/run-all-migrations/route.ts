import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Master Admin required' }, { status: 401 });
    }

    const sql = getDb();
    const migrationsDir = path.join(process.cwd(), 'migrations');
    
    // Get all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log('Found migration files:', files);

    const results = [];

    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
      
      console.log(`Running migration: ${file}`);

      // Split by semicolon and execute each statement
      const statements = migrationContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        try {
          await sql.unsafe(statement);
          console.log(`✓ Executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          // Ignore "already exists" errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('already exists') && !errorMessage.includes('already defined')) {
            console.error(`✗ Error in ${file}: ${errorMessage}`);
            results.push({ file, status: 'error', error: errorMessage });
            throw error;
          } else {
            console.log(`⊘ Skipped (already exists): ${statement.substring(0, 50)}...`);
          }
        }
      }

      results.push({ file, status: 'success' });
    }

    return NextResponse.json({ 
      message: 'All migrations executed',
      results 
    });
  } catch (error) {
    console.error('run-all-migrations error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Migration failed', details: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Master Admin required' }, { status: 401 });
    }

    const sql = getDb();
    
    // Check if the website_cms column exists
    const result = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'website_cms'
    `;

    const hasColumn = result.length > 0;
    
    return NextResponse.json({
      schemaStatus: {
        website_cms_exists: hasColumn,
        message: hasColumn ? 'Column exists - migrations have been run' : 'Column missing - need to run migrations'
      }
    });
  } catch (error) {
    console.error('check-schema error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Check failed', details: errorMsg }, { status: 500 });
  }
}
