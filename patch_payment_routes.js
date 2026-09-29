const fs = require('fs');

// Patch payment/[id]/route.ts
let code = fs.readFileSync('src/app/api/payment/[id]/route.ts', 'utf-8');
code = code.replace(
`    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized', details: session?.error || 'Unknown' }, { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } })
    }`,
`    const session = await getSession() as any;`
);

code = code.replace(
`    const isStaff = session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE';
    if (!isStaff && payment.order.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }`,
`    const isStaff = session && (session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE');
    if (payment.order.userId) {
      if (!session || !session.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } });
      }
      if (!isStaff && payment.order.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }`
);
fs.writeFileSync('src/app/api/payment/[id]/route.ts', code);

// Patch payment/[id]/message/route.ts
let codeMsg = fs.readFileSync('src/app/api/payment/[id]/message/route.ts', 'utf-8');
codeMsg = codeMsg.replace(
`    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }`,
`    const session = await getSession() as any;`
);

codeMsg = codeMsg.replace(
`    const isStaff = session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE';`,
`    const isStaff = session && (session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE');`
);

codeMsg = codeMsg.replace(
`    if (!isStaff && conversation.order.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }`,
`    if (conversation.order.userId) {
      if (!session || !session.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!isStaff && conversation.order.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }`
);

codeMsg = codeMsg.replace(
`    let actualSender = 'CUSTOMER';
    if (session.role === 'ADMIN') actualSender = 'ADMIN';
    else if (session.role === 'CUSTOMER_CARE') actualSender = 'CUSTOMER_CARE';`,
`    let actualSender = 'CUSTOMER';
    if (session && session.role === 'ADMIN') actualSender = 'ADMIN';
    else if (session && session.role === 'CUSTOMER_CARE') actualSender = 'CUSTOMER_CARE';`
);

codeMsg = codeMsg.replace(
`senderUserId: session.id,`,
`senderUserId: session?.id,`
);

fs.writeFileSync('src/app/api/payment/[id]/message/route.ts', codeMsg);

// Patch payment/[id]/submit/route.ts
let codeSubmit = fs.readFileSync('src/app/api/payment/[id]/submit/route.ts', 'utf-8');
codeSubmit = codeSubmit.replace(
`    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }`,
`    const session = await getSession() as any;`
);

codeSubmit = codeSubmit.replace(
`    const isStaff = session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE';
    if (!isStaff && payment.order.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }`,
`    const isStaff = session && (session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE');
    if (payment.order.userId) {
      if (!session || !session.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!isStaff && payment.order.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }`
);
fs.writeFileSync('src/app/api/payment/[id]/submit/route.ts', codeSubmit);

