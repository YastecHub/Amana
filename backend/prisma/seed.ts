import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

declare const process: { exit(code?: number): never };

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Amana database...');

  // 1. Create Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '08000000001' },
    update: {},
    create: {
      role: 'admin',
      name: 'Alhaji Musa Ibrahim',
      phone: '08000000001',
      passwordHash: adminPasswordHash,
    },
  });
  console.log('✓ Admin user created:', admin.name);

  // 2. Create Cooperative
  let cooperative = await prisma.cooperative.findFirst({
    where: { name: 'Amana Cooperative Society' },
  });

  if (!cooperative) {
    cooperative = await prisma.cooperative.create({
      data: {
        name: 'Amana Cooperative Society',
        adminUserId: admin.id,
        contributionAmount: 5000,
        cycle: 'monthly',
        maxLoanMultiple: 3,
      },
    });
  }

  console.log('✓ Cooperative created:', cooperative.name);

  // 3. Create Demo Members
  const memberPassword = await bcrypt.hash('member123', 10);

  const memberData = [
    {
      phone: '08000000002',
      name: 'Fatima Bello',
      accountRef: 'amana-fatima-001',
      accountNumber: '9012345678',
      bankName: 'Wema Bank',
      contributions: 8,
      months: 8,
    },
    {
      phone: '08000000003',
      name: 'Chukwuemeka Okafor',
      accountRef: 'amana-emeka-001',
      accountNumber: '9087654321',
      bankName: 'Wema Bank',
      contributions: 4,
      months: 4,
    },
    {
      phone: '08000000004',
      name: 'Aminu Garba',
      accountRef: 'amana-aminu-001',
      accountNumber: '9011223344',
      bankName: 'Wema Bank',
      contributions: 12,
      months: 14,
    },
  ];

  for (const md of memberData) {
    const memberUser = await prisma.user.upsert({
      where: { phone: md.phone },
      update: {},
      create: {
        role: 'member',
        name: md.name,
        phone: md.phone,
        passwordHash: memberPassword,
      },
    });

    const member = await prisma.member.upsert({
      where: { userId: memberUser.id },
      update: {},
      create: {
        cooperativeId: cooperative.id,
        userId: memberUser.id,
        bvnStatus: 'mocked',
        joinDate: new Date(Date.now() - md.months * 30 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });

    await prisma.virtualAccount.upsert({
      where: { memberId: member.id },
      update: {},
      create: {
        memberId: member.id,
        monnifyAccountReference: md.accountRef,
        accountNumber: md.accountNumber,
        bankName: md.bankName,
        bankCode: '035',
      },
    });

    // Create contributions
    for (let i = 0; i < md.contributions; i++) {
      const ref = `mock-txn-${md.phone}-${i + 1}`;
      const existing = await prisma.contribution.findUnique({
        where: { monnifyTxnRef: ref },
      });
      if (!existing) {
        await prisma.contribution.create({
          data: {
            memberId: member.id,
            amount: 5000,
            paidAt: new Date(Date.now() - (md.contributions - i) * 30 * 24 * 60 * 60 * 1000),
            monnifyTxnRef: ref,
            narration: `Monthly contribution - ${md.name}`,
            status: 'confirmed',
          },
        });
      }
    }

    // Compute and save score for Aminu (most history)
    if (md.name === 'Aminu Garba') {
      // Give Aminu a loan history too
      const loan = await prisma.loan.findFirst({ where: { memberId: member.id } });
      if (!loan) {
        const loanRecord = await prisma.loan.create({
          data: {
            memberId: member.id,
            principal: 15000,
            status: 'closed',
            scoreAtDecision: 72,
            breakdownJson: JSON.stringify({ note: 'seed loan' }),
            disbursementRef: 'mock-disb-aminu-001',
          },
        });
        await prisma.repayment.create({
          data: {
            loanId: loanRecord.id,
            amount: 15000,
            dueDate: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
            paidAt: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
            status: 'paid',
          },
        });
      }
    }

    console.log(`✓ Member created: ${md.name} (${md.phone})`);
  }

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Test credentials:');
  console.log('  Admin:  08000000001 / admin123');
  console.log('  Member: 08000000002 / member123');
  console.log('  Member: 08000000003 / member123');
  console.log('  Member: 08000000004 / member123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
