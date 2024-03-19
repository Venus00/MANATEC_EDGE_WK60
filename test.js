// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-var-requires

const prisma = new PrismaClient();

async function main() {
  try {
    // Insert data into the database
    for (let i = 0; i <= 80000; i++) {
      await prisma.alert.create({
        data: {
          serial: 'mac',
          code: 'test',
          description: 'description',
        },
      });
    }
    console.log('Data inserted into SQLite table successfully.');
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
