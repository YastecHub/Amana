import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const passwordHash = await bcrypt.hash('admin123', 10);
  const memberPasswordHash = await bcrypt.hash('member123', 10);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { phone: '08000000001' },
    update: {},
    create: {
      name: 'Alhaji Musa Admin',
      phone: '08000000001',
      role: 'admin',
      passwordHash
    }
  });

  // 2. Create Cooperative
  let coop = await prisma.cooperative.findFirst({
    where: { adminUserId: admin.id }
  });

  if (!coop) {
    coop = await prisma.cooperative.create({
      data: {
        name: 'Amana Cooperative Society',
        adminUserId: admin.id,
        contributionAmount: 5000,
        cycle: 'monthly',
        maxLoanMultiple: 3
      }
    });
  }

  // 3. Create Demo Members
  const demoUsers = [
    { name: 'Fatima Bello', phone: '08000000002', accountNumber: '1234567890' },
    { name: 'Oluwaseun Adeyemi', phone: '08000000003', accountNumber: '0987654321' }
  ];

  for (const [index, dUser] of demoUsers.entries()) {
    const user = await prisma.user.upsert({
      where: { phone: dUser.phone },
      update: {},
      create: {
        name: dUser.name,
        phone: dUser.phone,
        role: 'member',
        passwordHash: memberPasswordHash
      }
    });

    let member = await prisma.member.findUnique({
      where: { userId: user.id }
    });

    if (!member) {
      member = await prisma.member.create({
        data: {
          userId: user.id,
          cooperativeId: coop.id,
          bvnStatus: 'verified',
          joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90) // Joined 3 months ago
        }
      });
    }

    let virtualAcc = await prisma.virtualAccount.findUnique({
      where: { memberId: member.id }
    });

    if (!virtualAcc) {
      virtualAcc = await prisma.virtualAccount.create({
        data: {
          memberId: member.id,
          monnifyAccountReference: \`ref-\${member.id}\`,
          accountNumber: dUser.accountNumber,
          bankName: 'Wema Bank',
          bankCode: '035'
        }
      });
    }

    // Create 3 Contributions
    const existingContribs = await prisma.contribution.count({
      where: { memberId: member.id }
    });

    if (existingContribs === 0) {
      for (let i = 1; i <= 3; i++) {
        await prisma.contribution.create({
          data: {
            memberId: member.id,
            amount: 5000,
            monnifyTxnRef: \`mock-txn-\${user.id}-\${i}\`,
            narration: \`Monthly contribution \${i}\`,
            status: 'confirmed',
            paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * i)
          }
        });
      }
    }

    // Calculate and save initial score
    // Use the dynamic import equivalent for score calculation
    const scoringModule = await import('../src/services/scoring');
    await scoringModule.calculateMemberScore(member.id);
  }

  console.log('Seed complete ✓');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
