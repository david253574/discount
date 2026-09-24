const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find all orders that are APPROVED but payment is PENDING
  const orders = await prisma.order.findMany({
    where: { status: 'APPROVED' },
    include: { payment: true }
  });

  for (const o of orders) {
    if (o.payment && o.payment.status !== 'CONFIRMED') {
      await prisma.payment.update({
        where: { id: o.payment.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() }
      });
      console.log(`Updated payment for order ${o.id}`);
    }
  }

  // Find all orders that are CONFIRMED and change them to APPROVED
  const confirmedOrders = await prisma.order.findMany({
    where: { status: 'CONFIRMED' }
  });

  for (const o of confirmedOrders) {
    await prisma.order.update({
      where: { id: o.id },
      data: { status: 'APPROVED' }
    });
    console.log(`Fixed status for order ${o.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
