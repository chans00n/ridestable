import { enhancementService } from '../services/enhancement.service';
import { logger } from '../config/logger';
import { prisma } from '../config/database';

async function seedEnhancements() {
  try {
    logger.info('Starting enhancement seeding...');
    
    // Seed vehicle options
    await enhancementService.seedVehicleOptions();
    logger.info('Vehicle options seeded');
    
    // Seed enhancement options
    await enhancementService.seedEnhancementOptions();
    logger.info('Enhancement options seeded');
    
    logger.info('Enhancement seeding completed successfully');
  } catch (error) {
    logger.error('Failed to seed enhancements', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedEnhancements()
    .then(() => {
      console.log('✅ Enhancement seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Enhancement seeding failed:', error);
      process.exit(1);
    });
}

export { seedEnhancements };