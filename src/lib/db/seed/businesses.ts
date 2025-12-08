import { db } from '../index';
import { businesses } from '../schema';
import { count } from 'drizzle-orm';

export const australianBusinesses = [
  {
    name: 'Sydney Tech Solutions',
    email: 'info@sydneytech.com.au',
    city: 'Sydney',
    industry: 'IT Services',
    description: 'Leading IT support and software development company serving Sydney businesses',
    address: '123 Pitt Street, Sydney NSW 2000',
    phone: '+61 2 9001 2345',
    website: 'https://sydneytech.com.au',
    abn: '12345678901',
  },
  {
    name: 'Melbourne Marketing Agency',
    email: 'hello@melbournemarketing.com.au',
    city: 'Melbourne',
    industry: 'Marketing',
    description: 'Full-service digital marketing agency helping businesses grow online',
    address: '456 Collins Street, Melbourne VIC 3000',
    phone: '+61 3 9002 3456',
    website: 'https://melbournemarketing.com.au',
    abn: '23456789012',
  },
  {
    name: 'Brisbane Cleaning Services',
    email: 'contact@brisbanecleaning.com.au',
    city: 'Brisbane',
    industry: 'Cleaning',
    description: 'Professional commercial and residential cleaning services in Brisbane',
    address: '789 Queen Street, Brisbane QLD 4000',
    phone: '+61 7 3003 4567',
    website: 'https://brisbanecleaning.com.au',
    abn: '34567890123',
  },
  {
    name: 'Perth Accounting Firm',
    email: 'admin@perthaccounting.com.au',
    city: 'Perth',
    industry: 'Accounting',
    description: 'Chartered accounting firm providing tax and business advisory services',
    address: '321 St Georges Terrace, Perth WA 6000',
    phone: '+61 8 6004 5678',
    website: 'https://perthaccounting.com.au',
    abn: '45678901234',
  },
  {
    name: 'Adelaide Legal Services',
    email: 'info@adelaidelaw.com.au',
    city: 'Adelaide',
    industry: 'Legal',
    description: 'Boutique law firm specializing in commercial and property law',
    address: '654 King William Street, Adelaide SA 5000',
    phone: '+61 8 7005 6789',
    website: 'https://adelaidelaw.com.au',
    abn: '56789012345',
  },
  {
    name: 'Sydney Digital Agency',
    email: 'hello@sydneyagency.com.au',
    city: 'Sydney',
    industry: 'Marketing',
    description: 'Creative digital agency specializing in web design and social media',
    address: '789 George Street, Sydney NSW 2000',
    phone: '+61 2 9012 3456',
    website: 'https://sydneyagency.com.au',
    abn: '67890123456',
  },
  {
    name: 'Melbourne IT Consultants',
    email: 'support@melbourneit.com.au',
    city: 'Melbourne',
    industry: 'IT Services',
    description: 'Enterprise IT consulting and cloud migration specialists',
    address: '567 Bourke Street, Melbourne VIC 3000',
    phone: '+61 3 9013 4567',
    website: 'https://melbourneit.com.au',
    abn: '78901234567',
  },
  {
    name: 'Brisbane Business Coaching',
    email: 'coach@brisbanecoaching.com.au',
    city: 'Brisbane',
    industry: 'Training',
    description: 'Executive coaching and business development training programs',
    address: '234 Eagle Street, Brisbane QLD 4000',
    phone: '+61 7 3014 5678',
    website: 'https://brisbanecoaching.com.au',
    abn: '89012345678',
  },
  {
    name: 'Perth Graphic Design',
    email: 'creative@perthdesign.com.au',
    city: 'Perth',
    industry: 'Design',
    description: 'Award-winning graphic design and branding agency',
    address: '876 Murray Street, Perth WA 6000',
    phone: '+61 8 6015 6789',
    website: 'https://perthdesign.com.au',
    abn: '90123456789',
  },
  {
    name: 'Adelaide HR Services',
    email: 'hr@adelaidehr.com.au',
    city: 'Adelaide',
    industry: 'HR Services',
    description: 'Human resources consulting and recruitment services',
    address: '345 Rundle Mall, Adelaide SA 5000',
    phone: '+61 8 7016 7890',
    website: 'https://adelaidehr.com.au',
    abn: '01234567890',
  },
];

export async function seedBusinesses() {
  console.log('🌱 Seeding businesses...');

  try {
    // Check if businesses already exist
    const existingCount = await db.select({ count: count() }).from(businesses);

    if (existingCount[0].count > 0) {
      console.log('✅ Businesses already seeded, skipping...');
      return;
    }

    // Insert businesses
    const inserted = await db.insert(businesses).values(australianBusinesses).returning();

    console.log(`✅ Seeded ${inserted.length} businesses`);
    return inserted;
  } catch (error) {
    console.error('❌ Error seeding businesses:', error);
    throw error;
  }
}