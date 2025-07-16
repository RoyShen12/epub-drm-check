#!/usr/bin/env node

/**
 * Create test MOBI and AZW3 files for DRM detection testing
 */

const fs = require('fs').promises;
const path = require('path');

async function createMobiTestFiles() {
  const testDir = path.join(__dirname, 'test-files');

  try {
    await fs.mkdir(testDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  console.log('Creating MOBI/AZW3 test files...');

  // Create a valid MOBI file (simplified structure)
  await createValidMobi(path.join(testDir, 'valid-book.mobi'));

  // Create a DRM-protected MOBI file
  await createDRMMobi(path.join(testDir, 'drm-protected.mobi'));

  // Create an AZW3 file
  await createAZW3File(path.join(testDir, 'valid-book.azw3'));

  // Create a DRM-protected AZW3 file
  await createDRMAZW3File(path.join(testDir, 'drm-protected.azw3'));

  console.log('MOBI/AZW3 test files created successfully!');
}

async function createValidMobi(filePath) {
  // Create a minimal valid MOBI file structure
  const buffer = Buffer.alloc(1024);

  // PalmDB header (78 bytes)
  buffer.write('Test MOBI Book Title', 0, 'ascii'); // Name (32 bytes)
  buffer.writeUInt16BE(0x0002, 32); // Attributes
  buffer.writeUInt16BE(0x0001, 34); // Version
  buffer.writeUInt32BE(Date.now() / 1000, 36); // Creation date
  buffer.writeUInt32BE(Date.now() / 1000, 40); // Modification date
  buffer.writeUInt32BE(0, 44); // Last backup date
  buffer.writeUInt32BE(0, 48); // Modification number
  buffer.writeUInt32BE(0, 52); // App info ID
  buffer.writeUInt32BE(0, 56); // Sort info ID
  buffer.write('BOOK', 60, 'ascii'); // Type
  buffer.write('MOBI', 64, 'ascii'); // Creator
  buffer.writeUInt32BE(0, 68); // Unique ID seed
  buffer.writeUInt32BE(0, 72); // Next record list ID
  buffer.writeUInt16BE(2, 76); // Number of records

  // Record info list
  buffer.writeUInt32BE(78, 78); // Record 0 offset (MOBI header)
  buffer.writeUInt8(0, 82); // Record 0 attributes
  buffer.writeUInt32BE(310, 83); // Record 1 offset (text content)
  buffer.writeUInt8(0, 87); // Record 1 attributes

  // MOBI header at offset 78
  const mobiHeaderOffset = 78;
  buffer.write('MOBI', mobiHeaderOffset + 16, 'ascii'); // MOBI signature
  buffer.writeUInt32BE(232, mobiHeaderOffset + 20); // Header length
  buffer.writeUInt32BE(2, mobiHeaderOffset + 24); // MOBI type (Mobipocket Book)
  buffer.writeUInt32BE(6, mobiHeaderOffset + 28); // Text encoding (UTF-8)
  buffer.writeUInt32BE(0, mobiHeaderOffset + 32); // Unique ID
  buffer.writeUInt32BE(6, mobiHeaderOffset + 36); // File version

  // DRM fields (no DRM)
  buffer.writeUInt32BE(0xFFFFFFFF, mobiHeaderOffset + 168); // DRM offset (no DRM)
  buffer.writeUInt32BE(0, mobiHeaderOffset + 172); // DRM count
  buffer.writeUInt32BE(0, mobiHeaderOffset + 176); // DRM size
  buffer.writeUInt32BE(0, mobiHeaderOffset + 180); // DRM flags

  // Text content at offset 310
  const textContent = 'This is a test MOBI book without DRM protection. It should be detected as readable.';
  buffer.write(textContent, 310, 'utf8');

  await fs.writeFile(filePath, buffer);
  console.log('Created valid MOBI:', filePath);
}

async function createDRMMobi(filePath) {
  const buffer = Buffer.alloc(1024);

  // Similar to valid MOBI but with DRM indicators
  buffer.write('DRM Protected MOBI', 0, 'ascii');
  buffer.writeUInt16BE(0x0002, 32);
  buffer.writeUInt16BE(0x0001, 34);
  buffer.writeUInt32BE(Date.now() / 1000, 36);
  buffer.writeUInt32BE(Date.now() / 1000, 40);
  buffer.writeUInt32BE(0, 44);
  buffer.writeUInt32BE(0, 48);
  buffer.writeUInt32BE(0, 52);
  buffer.writeUInt32BE(0, 56);
  buffer.write('BOOK', 60, 'ascii');
  buffer.write('MOBI', 64, 'ascii');
  buffer.writeUInt32BE(0, 68);
  buffer.writeUInt32BE(0, 72);
  buffer.writeUInt16BE(3, 76); // More records (including DRM)

  // Record info
  buffer.writeUInt32BE(78, 78); // MOBI header
  buffer.writeUInt8(0, 82);
  buffer.writeUInt32BE(310, 83); // Text content
  buffer.writeUInt8(0, 87);
  buffer.writeUInt32BE(400, 88); // DRM record
  buffer.writeUInt8(0, 92);

  // MOBI header with DRM
  const mobiHeaderOffset = 78;
  buffer.write('MOBI', mobiHeaderOffset + 16, 'ascii');
  buffer.writeUInt32BE(232, mobiHeaderOffset + 20);
  buffer.writeUInt32BE(2, mobiHeaderOffset + 24);
  buffer.writeUInt32BE(6, mobiHeaderOffset + 28);
  buffer.writeUInt32BE(0, mobiHeaderOffset + 32);
  buffer.writeUInt32BE(6, mobiHeaderOffset + 36);

  // DRM fields (HAS DRM)
  buffer.writeUInt32BE(400, mobiHeaderOffset + 168); // DRM offset
  buffer.writeUInt32BE(1, mobiHeaderOffset + 172); // DRM count
  buffer.writeUInt32BE(64, mobiHeaderOffset + 176); // DRM size
  buffer.writeUInt32BE(0x0001, mobiHeaderOffset + 180); // DRM flags

  // EXTH header with DRM records
  buffer.writeUInt32BE(0x40, mobiHeaderOffset + 128); // EXTH flag

  // Encrypted/scrambled text content
  const encryptedContent = Buffer.from('ENCRYPTED_CONTENT_PLACEHOLDER_DRM_PROTECTED', 'ascii');
  encryptedContent.copy(buffer, 310);

  await fs.writeFile(filePath, buffer);
  console.log('Created DRM-protected MOBI:', filePath);
}

async function createAZW3File(filePath) {
  // AZW3 is similar to MOBI but with different identifiers
  const buffer = Buffer.alloc(1024);

  buffer.write('Test AZW3 Book', 0, 'ascii');
  buffer.writeUInt16BE(0x0002, 32);
  buffer.writeUInt16BE(0x0001, 34);
  buffer.writeUInt32BE(Date.now() / 1000, 36);
  buffer.writeUInt32BE(Date.now() / 1000, 40);
  buffer.writeUInt32BE(0, 44);
  buffer.writeUInt32BE(0, 48);
  buffer.writeUInt32BE(0, 52);
  buffer.writeUInt32BE(0, 56);
  buffer.write('BOOK', 60, 'ascii');
  buffer.write('MOBI', 64, 'ascii'); // AZW3 still uses MOBI creator
  buffer.writeUInt32BE(0, 68);
  buffer.writeUInt32BE(0, 72);
  buffer.writeUInt16BE(2, 76);

  buffer.writeUInt32BE(78, 78);
  buffer.writeUInt8(0, 82);
  buffer.writeUInt32BE(310, 83);
  buffer.writeUInt8(0, 87);

  // MOBI header for AZW3
  const mobiHeaderOffset = 78;
  buffer.write('MOBI', mobiHeaderOffset + 16, 'ascii');
  buffer.writeUInt32BE(232, mobiHeaderOffset + 20);
  buffer.writeUInt32BE(8, mobiHeaderOffset + 24); // AZW3 type
  buffer.writeUInt32BE(6, mobiHeaderOffset + 28);
  buffer.writeUInt32BE(0, mobiHeaderOffset + 32);
  buffer.writeUInt32BE(8, mobiHeaderOffset + 36); // Version 8 for AZW3

  // No DRM
  buffer.writeUInt32BE(0xFFFFFFFF, mobiHeaderOffset + 168);
  buffer.writeUInt32BE(0, mobiHeaderOffset + 172);
  buffer.writeUInt32BE(0, mobiHeaderOffset + 176);
  buffer.writeUInt32BE(0, mobiHeaderOffset + 180);

  const textContent = 'This is a test AZW3 book without DRM protection.';
  buffer.write(textContent, 310, 'utf8');

  await fs.writeFile(filePath, buffer);
  console.log('Created valid AZW3:', filePath);
}

async function createDRMAZW3File(filePath) {
  const buffer = Buffer.alloc(1024);

  buffer.write('DRM Protected AZW3', 0, 'ascii');
  buffer.writeUInt16BE(0x0002, 32);
  buffer.writeUInt16BE(0x0001, 34);
  buffer.writeUInt32BE(Date.now() / 1000, 36);
  buffer.writeUInt32BE(Date.now() / 1000, 40);
  buffer.writeUInt32BE(0, 44);
  buffer.writeUInt32BE(0, 48);
  buffer.writeUInt32BE(0, 52);
  buffer.writeUInt32BE(0, 56);
  buffer.write('BOOK', 60, 'ascii');
  buffer.write('MOBI', 64, 'ascii');
  buffer.writeUInt32BE(0, 68);
  buffer.writeUInt32BE(0, 72);
  buffer.writeUInt16BE(3, 76);

  buffer.writeUInt32BE(78, 78);
  buffer.writeUInt8(0, 82);
  buffer.writeUInt32BE(310, 83);
  buffer.writeUInt8(0, 87);
  buffer.writeUInt32BE(400, 88); // DRM record
  buffer.writeUInt8(0, 92);

  const mobiHeaderOffset = 78;
  buffer.write('MOBI', mobiHeaderOffset + 16, 'ascii');
  buffer.writeUInt32BE(232, mobiHeaderOffset + 20);
  buffer.writeUInt32BE(8, mobiHeaderOffset + 24); // AZW3 type
  buffer.writeUInt32BE(6, mobiHeaderOffset + 28);
  buffer.writeUInt32BE(0, mobiHeaderOffset + 32);
  buffer.writeUInt32BE(8, mobiHeaderOffset + 36);

  // HAS DRM
  buffer.writeUInt32BE(400, mobiHeaderOffset + 168);
  buffer.writeUInt32BE(1, mobiHeaderOffset + 172);
  buffer.writeUInt32BE(64, mobiHeaderOffset + 176);
  buffer.writeUInt32BE(0x0002, mobiHeaderOffset + 180); // Different DRM flags for AZW3

  // EXTH with DRM
  buffer.writeUInt32BE(0x40, mobiHeaderOffset + 128);

  const encryptedContent = Buffer.from('AZW3_ENCRYPTED_CONTENT_AMAZON_DRM', 'ascii');
  encryptedContent.copy(buffer, 310);

  await fs.writeFile(filePath, buffer);
  console.log('Created DRM-protected AZW3:', filePath);
}

if (require.main === module) {
  createMobiTestFiles().catch(error => {
    console.error('Error creating test files:', error.message);
    process.exit(1);
  });
}

module.exports = { createMobiTestFiles };
