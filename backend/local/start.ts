#!/usr/bin/env ts-node
/**
 * Local development startup script
 * Seeds test data and displays connection information
 */

import { networkInterfaces } from 'os';
import { seedOfflineData } from '../src/lib/db';

console.log('\n========================================');
console.log('🚀 Starting Kefir Backend (Offline Mode)');
console.log('========================================\n');

// Seed test data
seedOfflineData();

// Get local IP addresses
function getLocalIpAddresses(): string[] {
  const nets = networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(nets)) {
    const net = nets[name];
    if (!net) continue;

    for (const netInfo of net) {
      // Skip internal and non-IPv4 addresses
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        ips.push(netInfo.address);
      }
    }
  }

  return ips;
}

const localIps = getLocalIpAddresses();
const primaryIp = localIps[0] || 'localhost';

console.log('\n📡 Network Information:');
console.log('─────────────────────────────────────');
console.log(`   Local: http://localhost:3000`);
if (localIps.length > 0) {
  localIps.forEach((ip) => {
    console.log(`   Network: http://${ip}:3000`);
  });
}

console.log('\n👤 Test Users:');
console.log('─────────────────────────────────────');
console.log('   User ID: test-user-1');
console.log('   Email: alice@example.com');
console.log('   ');
console.log('   User ID: test-user-2');
console.log('   Email: bob@example.com');

console.log('\n📦 Pre-seeded Data:');
console.log('─────────────────────────────────────');
console.log('   ✓ 2 test users');
console.log('   ✓ 3 test batches');
console.log('   ✓ 3 test events');
console.log('   ✓ 1 test device');

console.log('\n🔑 Authentication:');
console.log('─────────────────────────────────────');
console.log('   Add header: X-User-Id: test-user-1');
console.log('   (Or omit header to use default test user)');

console.log('\n📝 Example cURL Command:');
console.log('─────────────────────────────────────');
console.log(`   curl -H "X-User-Id: test-user-1" \\`);
console.log(`        http://${primaryIp}:3000/batches`);

console.log('\n📱 Mobile App Configuration:');
console.log('─────────────────────────────────────');
console.log('   const API_URL = __DEV__');
console.log(`     ? 'http://${primaryIp}:3000'`);
console.log(`     : 'https://prod-api-url.com';`);

console.log('\n🌐 API Endpoints:');
console.log('─────────────────────────────────────');
console.log('   Public (no auth):');
console.log('   GET  /public/b/:batchId');
console.log('   ');
console.log('   Authenticated (needs X-User-Id):');
console.log('   POST /batches');
console.log('   GET  /batches');
console.log('   GET  /batches/:id');
console.log('   POST /batches/:id/events');
console.log('   GET  /batches/:id/events');
console.log('   GET  /batches/:id/reminders/suggestions');
console.log('   POST /batches/:id/reminders/confirm');
console.log('   GET  /me/reminders');
console.log('   POST /me/devices');
console.log('   GET  /export.csv');

console.log('\n⚡️ Starting Serverless Offline...');
console.log('========================================\n');

// The actual serverless offline start will happen after this script
// via the npm script: "local:start": "ts-node local/start.ts && serverless offline"

