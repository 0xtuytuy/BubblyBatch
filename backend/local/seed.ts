#!/usr/bin/env ts-node
/**
 * Seed offline storage with test data
 */

import { seedOfflineData, getOfflineStorageSize } from '../src/lib/db';

console.log('\n🌱 Seeding offline storage...\n');

seedOfflineData();

const size = getOfflineStorageSize();
console.log(`\n✅ Storage seeded with ${size} items!\n');

