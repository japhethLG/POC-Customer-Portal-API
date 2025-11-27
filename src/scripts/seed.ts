import mongoose from 'mongoose';
import { config } from '../config/env';
import { Customer } from '../models';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing customers (optional - comment out if you want to keep existing data)
    await Customer.deleteMany({});
    console.log('🗑️  Cleared existing customers');

    // Create demo customers
    const customers = [
      {
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St, Springfield',
      },
      {
        email: 'jane@example.com',
        phone: '+0987654321',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Ave, Portland',
      },
      {
        email: 'bob@example.com',
        phone: '+1122334455',
        password: 'password123',
        firstName: 'Bob',
        lastName: 'Johnson',
        address: '789 Pine Rd, Seattle',
      },
    ];

    for (const customerData of customers) {
      await Customer.create(customerData);
      console.log(`✅ Created customer: ${customerData.email}`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Test credentials (Password: password123):');
    console.log('');
    customers.forEach((c, i) => {
      console.log(`Customer ${i + 1}:`);
      console.log(`  Email: ${c.email}`);
      console.log(`  Phone: ${c.phone}`);
      console.log(`  Password: password123`);
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();

