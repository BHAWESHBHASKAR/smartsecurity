// Fix cameras in database with proper RTSP URLs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCameras() {
  console.log('🔧 Fixing cameras with RTSP URLs...\n');

  const cameraIds = [
    '6906b5fe9c1670bd89f68ac5',
    '6906b6219c1670bd89f68ac6',
    '6906b7099c1670bd89f68ac7',
  ];

  const rtspUrl = 'rtsp://localhost:8554/local_video';

  for (const cameraId of cameraIds) {
    try {
      const camera = await prisma.camera.update({
        where: { id: cameraId },
        data: {
          streamUrl: rtspUrl,
          status: 'ACTIVE',
        },
      });

      console.log(`✅ Updated camera ${cameraId}`);
      console.log(`   Stream URL: ${camera.streamUrl}`);
      console.log('');
    } catch (error: any) {
      console.error(`❌ Failed to update camera ${cameraId}:`, error.message);
    }
  }

  console.log('✅ All cameras fixed!\n');
  console.log('🎯 Now refresh your browser at http://localhost:3000\n');
  
  await prisma.$disconnect();
}

fixCameras().catch(console.error);
