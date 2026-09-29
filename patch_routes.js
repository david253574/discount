const fs = require('fs');

// Patch customer-care/requests
let code = fs.readFileSync('src/app/api/customer-care/requests/route.ts', 'utf-8');

code = code.replace(
`    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized', details: session?.error || 'Unknown' }, { status: 401 })
    }`,
`    const session = await getSession() as any;
    const userId = session?.id || null;`
);

code = code.replace(`userId: session.id,`, `userId: userId,`);

code = code.replace(
`      // Duplicate protection check
      const existingOrder = await tx.order.findFirst({
        where: {
          userId: session.id,
          modelId: data.modelId,
          variantId: data.variantId,
          paymentType: 'CUSTOMER_CARE',
          status: 'PENDING'
        }
      });`,
`      // Duplicate protection check
      const existingOrder = userId ? await tx.order.findFirst({
        where: {
          userId: userId,
          modelId: data.modelId,
          variantId: data.variantId,
          paymentType: 'CUSTOMER_CARE',
          status: 'PENDING'
        }
      }) : null;`
);

fs.writeFileSync('src/app/api/customer-care/requests/route.ts', code);

// Patch orders
let code2 = fs.readFileSync('src/app/api/orders/route.ts', 'utf-8');

code2 = code2.replace(
`    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }`,
`    const session = await getSession() as any;
    const userId = session?.id || null;`
);

code2 = code2.replace(`userId: session.id,`, `userId: userId,`);

fs.writeFileSync('src/app/api/orders/route.ts', code2);

// Remove the redirect from order/[id]/page.tsx
let code3 = fs.readFileSync('src/app/order/[id]/page.tsx', 'utf-8');
code3 = code3.replace(
`} else if (res.status === 401) {
        router.push(\`/login?redirect=/order/\${id}\`);`,
``);
fs.writeFileSync('src/app/order/[id]/page.tsx', code3);

