const { createClient } = require('@libsql/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const localDb = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'));

const turso = createClient({ 
  url: 'libsql://logistics-logistics.aws-us-east-2.turso.io', 
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNTc2NjUsImlkIjoiMDFhMDk3ZTMtYjkwMS03NDA0LTliZWMtNWMzZmRiMzE2Mjg4Iiwia2lkIjoiOFpDM0pCdDBCSGE5YXp0bzdDT1V2c0tBLThFSm9ISURmbHUzV3lVYnNrTSIsInJpZCI6IjBhM2QzYjVkLTM1NWYtNDE2My04Y2I2LTczNTQ4YzMyOTE5ZiJ9.xFYSNxHpbkz-c3b6u7z31LC2A1iXIeh_cJKv17gpEiEDAmiMYOEqETPRBWqTPOWJ56atoKQPigpTieYc7_3VCw' 
});

async function migrateTable(tableName, columns) {
  return new Promise((resolve, reject) => {
    localDb.all(`SELECT * FROM "${tableName}"`, async (err, rows) => {
      if (err) return reject(err);
      
      console.log(`Found ${rows.length} records in ${tableName}. Migrating...`);
      for (const row of rows) {
        try {
          const colNames = columns.map(c => `"${c}"`).join(', ');
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map(c => {
            // Handle date conversion if needed, but Turso LibSQL accepts ISO strings or unix time depending on prisma.
            // Let's just pass the raw value, local DB datetime might be unix time or string.
            if (row[c] instanceof Date) return row[c].toISOString();
            return row[c];
          });
          
          await turso.execute({
            sql: `INSERT OR IGNORE INTO "${tableName}" (${colNames}) VALUES (${placeholders})`,
            args: values
          });
        } catch (e) {
          console.error(`Error inserting into ${tableName}:`, e.message);
        }
      }
      resolve();
    });
  });
}

async function run() {
  try {
    await migrateTable("User", ["id", "email", "password", "role", "createdAt", "updatedAt"]);
    await migrateTable("VehicleModel", ["id", "slug", "name", "subtitle", "image", "range", "speed", "acceleration", "price", "status", "createdAt", "updatedAt"]);
    await migrateTable("Variant", ["id", "modelId", "slug", "name", "range", "speed", "acceleration", "price", "popular", "status", "createdAt", "updatedAt"]);
    await migrateTable("DiscountEligibility", ["id", "name", "amountToPay", "createdAt"]);
    await migrateTable("DiscountCredential", ["id", "recipientName", "pinHash", "reference", "status", "createdAt", "redeemedAt"]);
    await migrateTable("Order", ["id", "userId", "modelId", "variantId", "name", "address", "city", "zip", "paymentType", "crypto", "receiptUrl", "finalAmount", "discountAmount", "status", "phone", "country", "deliveryAddress", "deliveryPhone", "deliveryDatePref", "deliveryInstructions", "deliveryStatus", "createdAt", "updatedAt"]);
    await migrateTable("Payment", ["id", "orderId", "method", "amountDue", "currency", "btcAddress", "txid", "status", "message", "submittedAt", "confirmedAt", "confirmedBy", "rejectionReason", "createdAt", "updatedAt"]);
    console.log("Migration complete!");
  } catch (err) {
    console.error(err);
  }
}

run();
