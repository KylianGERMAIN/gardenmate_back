import app from './app';
import { prisma } from './prisma';

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`
    
    ▞▀▖        ▌      ▙▗▌   ▐      
    ▌▄▖▝▀▖▙▀▖▞▀▌▞▀▖▛▀▖▌▘▌▝▀▖▜▀ ▞▀▖ 
    ▌ ▌▞▀▌▌  ▌ ▌▛▀ ▌ ▌▌ ▌▞▀▌▐ ▖▛▀  
    ▝▀ ▝▀▘▘  ▝▀▘▝▀▘▘ ▘▘ ▘▝▀▘ ▀ ▝▀▘ 

   🚀 GardenMate Backend is running on http://localhost:${PORT} 🚀
  `);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});
