const fs = require('fs');
let code = fs.readFileSync('src/app/api/customer-care/requests/route.ts', 'utf-8');

code = code.replace(
`    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }`,
`    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized', details: session?.error || 'Unknown' }, { status: 401 })
    }`
);

fs.writeFileSync('src/app/api/customer-care/requests/route.ts', code);
