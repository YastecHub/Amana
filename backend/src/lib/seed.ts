import bcrypt from 'bcryptjs';
import prisma from './prisma';

type MemberSeed = {
  phone: string;
  name: string;
  accountRef: string;
  accountNumber: string;
  bankName: string;
  contributions: number;
  months: number;
};

const adminPhone = '08000000001';
const adminPassword = 'admin123';
const memberPassword = 'member123';
const cooperativeName = 'Amana Cooperative Society';

const memberData: MemberSeed[] = [
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

export async function ensureSeedData(): Promise<void> {
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      role: 'admin',
      name: 'Alhaji Musa Ibrahim',
      phone: adminPhone,
      passwordHash: adminPasswordHash,
    },
  });

  console.log('Seed: ensured admin user exists:', adminUser.phone);

  let cooperative = await prisma.cooperative.findFirst({
    where: { name: cooperativeName },
  });

  if (!cooperative) {
    cooperative = await prisma.cooperative.create({
      data: {
        name: cooperativeName,
        adminUserId: adminUser.id,
        contributionAmount: 5000,
        cycle: 'monthly',
        maxLoanMultiple: 3,
      },
    });
    console.log('Seed: created cooperative:', cooperative.name);
  } else {
    console.log('Seed: cooperative already exists:', cooperative.name);
  }

  for (const md of memberData) {
    const memberPasswordHash = await bcrypt.hash(memberPassword, 10);

    const memberUser = await prisma.user.upsert({
      where: { phone: md.phone },
      update: {},
      create: {
        role: 'member',
        name: md.name,
        phone: md.phone,
        passwordHash: memberPasswordHash,
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

    for (let i = 0; i < md.contributions; i += 1) {
      const ref = `mock-txn-${md.phone}-${i + 1}`;
      await prisma.contribution.upsert({
        where: { monnifyTxnRef: ref },
        update: {},
        create: {
          memberId: member.id,
          amount: 5000,
          paidAt: new Date(Date.now() - (md.contributions - i) * 30 * 24 * 60 * 60 * 1000),
          monnifyTxnRef: ref,
          narration: `Monthly contribution - ${md.name}`,
          status: 'confirmed',
        },
      });
    }

    if (md.name === 'Aminu Garba') {
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

    console.log(`Seed: ensured member exists: ${md.name} (${md.phone})`);
  }

  console.log('Seed: initial data ensured.');
}
