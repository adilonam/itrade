import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding investments...');

  const investments = await prisma.investment.createMany({
    data: [
      {
        title: 'Luxembourg Real Estate Fund',
        description:
          'Diversified real estate investment in Luxembourg premium properties with stable returns.',
        country: 'Luxembourg',
        duration: 12,
        rentability: 8.5,
        minInvestment: 1000,
        maxInvestment: 50000,
        autoReinvestment: true,
        totalCapacity: 5000000,
        currentCapacity: 0,
        riskLevel: 'MEDIUM',
        isActive: true
      },
      {
        title: 'Swiss Green Energy Project',
        description:
          'Investment in renewable energy infrastructure across Switzerland.',
        country: 'Switzerland',
        duration: 24,
        rentability: 12.0,
        minInvestment: 5000,
        maxInvestment: 100000,
        autoReinvestment: false,
        totalCapacity: 10000000,
        currentCapacity: 0,
        riskLevel: 'HIGH',
        isActive: true
      },
      {
        title: 'German Tech Startups',
        description:
          'Early-stage investment in promising German technology startups.',
        country: 'Germany',
        duration: 36,
        rentability: 15.0,
        minInvestment: 2000,
        maxInvestment: 25000,
        autoReinvestment: true,
        totalCapacity: 2000000,
        currentCapacity: 0,
        riskLevel: 'HIGH',
        isActive: true
      },
      {
        title: 'French Government Bonds',
        description:
          'Low-risk investment in French treasury bonds with guaranteed returns.',
        country: 'France',
        duration: 6,
        rentability: 3.5,
        minInvestment: 500,
        maxInvestment: null,
        autoReinvestment: false,
        totalCapacity: null,
        currentCapacity: 0,
        riskLevel: 'LOW',
        isActive: true
      }
    ]
  });

  console.log(`Created ${investments.count} investments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
