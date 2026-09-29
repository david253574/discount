const fs = require('fs');

let code = fs.readFileSync('src/app/api/ably/auth/route.ts', 'utf-8');

code = code.replace(
`    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }`,
`    const session = await getSession() as any;`
);

code = code.replace(
`    const isStaff =
      session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE';

    if (!isStaff) {
      // Customer: verify they own the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true },
      });

      // Return 404 regardless of existence for unauthorized orderId —
      // consistent with how /api/payment/[id] handles unauthorized access.
      if (!order || order.userId !== session.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }`,
`    const isStaff = session && (session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE');

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (order.userId) {
      if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!isStaff && order.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }`
);

code = code.replace(
`    const tokenRequest = await createTokenRequest(channel, session.id);`,
`    const clientId = session?.id || 'guest-' + Math.random().toString(36).substring(7);
    const tokenRequest = await createTokenRequest(channel, clientId);`
);

fs.writeFileSync('src/app/api/ably/auth/route.ts', code);
