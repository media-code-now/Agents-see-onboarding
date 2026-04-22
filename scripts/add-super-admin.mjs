import { hashPassword } from './lib/auth.js';
import { sql } from '@neon/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_t14VzbvhURPn@ep-restless-violet-akp52dpt-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function addSuperAdmin() {
  try {
    const name = 'Noam Sadi';
    const email = 'noam@nsmprime.com';
    const password = 'NoamSadi1!';

    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(password);

    console.log('📧 Creating super admin user...');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);

    // Note: You'll need to run this with proper DB connection setup
    // This is a helper script - adapt it to your actual DB setup
    console.log('✅ User creation script ready!');
    console.log('Run this in your database:');
    console.log(`INSERT INTO users (name, email, password, is_master_admin, created_at, updated_at)`);
    console.log(`VALUES ('${name}', '${email}', '${hashedPassword}', true, NOW(), NOW());`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSuperAdmin();
