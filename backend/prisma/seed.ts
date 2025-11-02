import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartsecurity.com' },
    update: {},
    create: {
      email: 'admin@smartsecurity.com',
      phone: '+1234567890',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create client user 1
  const clientPassword = await bcrypt.hash('client123', 10);
  const client1 = await prisma.user.upsert({
    where: { email: 'client1@example.com' },
    update: {},
    create: {
      email: 'client1@example.com',
      phone: '+1234567891',
      password: clientPassword,
      role: 'CLIENT',
      store: {
        create: {
          name: 'Downtown Electronics Store',
          address: '123 Main Street, New York, NY 10001',
          latitude: 40.7589,
          longitude: -73.9851,
          policeNumber: '+1234567892',
          cameras: {
            create: [
              {
                ipAddress: '192.168.1.101',
                status: 'ACTIVE',
                position: 0,
              },
              {
                ipAddress: '192.168.1.102',
                status: 'ACTIVE',
                position: 1,
              },
              {
                ipAddress: '192.168.1.103',
                status: 'INACTIVE',
                position: 2,
              },
            ],
          },
        },
      },
    },
  });
  console.log('✅ Created client user 1:', client1.email);

  // Create client user 2
  const client2 = await prisma.user.upsert({
    where: { email: 'client2@example.com' },
    update: {},
    create: {
      email: 'client2@example.com',
      phone: '+1234567893',
      password: clientPassword,
      role: 'CLIENT',
      store: {
        create: {
          name: 'Westside Jewelry Shop',
          address: '456 Broadway, Los Angeles, CA 90012',
          latitude: 34.0522,
          longitude: -118.2437,
          policeNumber: '+1234567894',
          cameras: {
            create: [
              {
                ipAddress: '192.168.2.101',
                status: 'ACTIVE',
                position: 0,
              },
              {
                ipAddress: '192.168.2.102',
                status: 'ACTIVE',
                position: 1,
              },
            ],
          },
        },
      },
    },
  });
  console.log('✅ Created client user 2:', client2.email);

  // Create sample alert for client 1
  const store1 = await prisma.store.findUnique({
    where: { userId: client1.id },
  });

  if (store1) {
    const alert = await prisma.alert.create({
      data: {
        storeId: store1.id,
        detectionType: 'HELMET',
        imageUrl: 'https://via.placeholder.com/400x300?text=Helmet+Detected',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Created sample alert for store 1');

    // Create siren log
    await prisma.sirenLog.create({
      data: {
        storeId: store1.id,
        action: 'ON',
        triggeredBy: 'SYSTEM',
        alertId: alert.id,
      },
    });
    console.log('✅ Created siren log for alert');
  }

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Test Credentials:');
  console.log('');
  console.log('Admin Login:');
  console.log('  Email: admin@smartsecurity.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Client 1 Login:');
  console.log('  Email: client1@example.com');
  console.log('  Password: client123');
  console.log('');
  console.log('Client 2 Login:');
  console.log('  Email: client2@example.com');
  console.log('  Password: client123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
