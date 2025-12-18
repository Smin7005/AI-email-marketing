import { db } from '../src/lib/db';
import { campaignService } from '../src/lib/services/campaign';
import { businesses, campaignItems } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function diagnoseCampaignCreation() {
  console.log('=== Campaign Creation Diagnostic ===\n');

  try {
    // Step 1: Find a valid business ID
    console.log('Step 1: Finding valid business IDs...');
    const businessList = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        email: businesses.email
      })
      .from(businesses)
      .limit(5);

    if (businessList.length === 0) {
      console.error('❌ No businesses found in database!');
      console.log('Please run the seed script first: npm run seed');
      return;
    }

    console.log(`✅ Found ${businessList.length} businesses`);
    console.log('Sample businesses:');
    businessList.forEach(b => {
      console.log(`  - ID: ${b.id}, Name: ${b.name}, Email: ${b.email}`);
    });

    // Step 2: Test campaign creation with hardcoded data
    console.log('\nStep 2: Testing campaign creation...');
    const testData = {
      name: 'Test Campaign - Diagnostic',
      serviceDescription: 'We provide IT consulting services for small businesses',
      emailTone: 'professional' as const,
      businessIds: [businessList[0].id]
    };

    console.log('Creating campaign with data:', JSON.stringify(testData, null, 2));

    // Step 3: Create campaign
    const testOrganizationId = 'test-org-' + Date.now();
    const campaign = await campaignService.createCampaign(testOrganizationId, testData);

    console.log('\n✅ Campaign created successfully!');
    console.log('Campaign details:', JSON.stringify(campaign, null, 2));

    // Step 4: Verify campaign items were created
    console.log('\nStep 3: Verifying campaign items...');
    const items = await db
      .select({
        id: campaignItems.id,
        businessId: campaignItems.businessId,
        status: campaignItems.status
      })
      .from(campaignItems)
      .where(eq(campaignItems.campaignId, campaign.id));

    console.log(`✅ Created ${items.length} campaign items`);
    items.forEach(item => {
      console.log(`  - Item ID: ${item.id}, Business ID: ${item.businessId}, Status: ${item.status}`);
    });

  } catch (error) {
    console.error('\n❌ Campaign creation failed!');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);

    // Check for specific errors
    if ((error as Error).message.includes('business')) {
      console.error('\n💡 This appears to be a business ID validation error.');
      console.error('   Make sure businessIds are numbers, not strings.');
    }
    if ((error as Error).message.includes('organization')) {
      console.error('\n💡 This appears to be an organization ID error.');
    }
    if ((error as Error).message.includes('foreign key')) {
      console.error('\n💡 This appears to be a foreign key constraint error.');
      console.error('   Make sure all referenced IDs exist in the database.');
    }
  }
}

// Run the diagnostic
console.log('Starting campaign creation diagnostic...\n');
diagnoseCampaignCreation()
  .then(() => {
    console.log('\n=== Diagnostic Complete ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Diagnostic Failed ===');
    console.error(error);
    process.exit(1);
  });