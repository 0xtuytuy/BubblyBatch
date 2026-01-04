#!/usr/bin/env ts-node
/**
 * Clean offline storage
 */

import { clearOfflineData, getOfflineStorageSize } from '../src/lib/db';

console.log('\n🧹 Cleaning offline storage...\n');

const sizeBefore = getOfflineStorageSize();
console.log(`   Items before: ${sizeBefore}`);

clearOfflineData();

const sizeAfter = getOfflineStorageSize();
console.log(`   Items after: ${sizeAfter}`);

console.log('\n✅ Storage cleaned!\n');

