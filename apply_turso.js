const { createClient } = require('@libsql/client');
const fs = require('fs');

const dbUrl = 'libsql://logistics-logistics.aws-us-east-2.turso.io';
const dbToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNTc2NjUsImlkIjoiMDFhMDk3ZTMtYjkwMS03NDA0LTliZWMtNWMzZmRiMzE2Mjg4Iiwia2lkIjoiOFpDM0pCdDBCSGE5YXp0bzdDT1V2c0tBLThFSm9ISURmbHUzV3lVYnNrTSIsInJpZCI6IjBhM2QzYjVkLTM1NWYtNDE2My04Y2I2LTczNTQ4YzMyOTE5ZiJ9.xFYSNxHpbkz-c3b6u7z31LC2A1iXIeh_cJKv17gpEiEDAmiMYOEqETPRBWqTPOWJ56atoKQPigpTieYc7_3VCw';

const client = createClient({ url: dbUrl, authToken: dbToken });

async function run() {
  try {
    console.log('Reading migration.sql...');
    const sql = fs.readFileSync('migration.sql', 'utf-8');
    
    // Split by semicolons for LibSQL
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    console.log(`Executing ${statements.length} statements...`);
    for (let stmt of statements) {
      if (stmt.trim() !== '') {
        await client.execute(stmt);
      }
    }
    console.log('Successfully applied Prisma schema to Turso!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
