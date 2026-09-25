const { createClient } = require('@libsql/client');

const client = createClient({ 
  url: 'libsql://logistics-logistics.aws-us-east-2.turso.io', 
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNTc2NjUsImlkIjoiMDFhMDk3ZTMtYjkwMS03NDA0LTliZWMtNWMzZmRiMzE2Mjg4Iiwia2lkIjoiOFpDM0pCdDBCSGE5YXp0bzdDT1V2c0tBLThFSm9ISURmbHUzV3lVYnNrTSIsInJpZCI6IjBhM2QzYjVkLTM1NWYtNDE2My04Y2I2LTczNTQ4YzMyOTE5ZiJ9.xFYSNxHpbkz-c3b6u7z31LC2A1iXIeh_cJKv17gpEiEDAmiMYOEqETPRBWqTPOWJ56atoKQPigpTieYc7_3VCw' 
});

async function run() {
  const models = await client.execute("SELECT slug FROM VehicleModel");
  console.log("Turso VehicleModels:", models.rows);

  const elig = await client.execute("SELECT name FROM DiscountEligibility");
  console.log("Turso Discounts:", elig.rows);
}

run();
