const fs = require('fs');
let code = fs.readFileSync('src/app/api/attachments/[id]/route.ts', 'utf-8');

code = code.replace(
`  const session = await getSession() as any;
  if (!session || !session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }`,
`  const session = await getSession() as any;`
);

code = code.replace(
`  const isCustomer = session.role === 'USER';
  const isStaff = session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE';

  let authorized = false;
  if (isStaff) {
    authorized = true;
  } else if (isCustomer) {
    if (attachment.message.conversation.order.userId === session.id) {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }`,
`  const isStaff = session && (session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE');
  const orderUserId = attachment.message.conversation.order.userId;

  let authorized = false;
  if (!orderUserId) {
    authorized = true; // Guest order
  } else if (isStaff) {
    authorized = true;
  } else if (session && session.id === orderUserId) {
    authorized = true;
  }

  if (!authorized) {
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }`
);

fs.writeFileSync('src/app/api/attachments/[id]/route.ts', code);
