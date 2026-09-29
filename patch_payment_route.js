const fs = require('fs');
let code = fs.readFileSync('src/app/api/payment/[id]/route.ts', 'utf-8');
code = code.replace(
  "return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })",
  "return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } })"
);
fs.writeFileSync('src/app/api/payment/[id]/route.ts', code);
