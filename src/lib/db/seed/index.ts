import 'dotenv/config';
import { seedBusinesses } from './businesses';

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed businesses
    await seedBusinesses();

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { main as seedDatabase };