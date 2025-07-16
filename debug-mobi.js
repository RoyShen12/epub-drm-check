#!/usr/bin/env node

const path = require('path');
const { readMobiDRMInfo, parseEXTHRecords } = require('./src/utils');

async function debugMobiFile(filePath) {
  console.log(`\n=== Debugging: ${path.basename(filePath)} ===`);

  try {
    // Get MOBI info
    const mobiInfo = await readMobiDRMInfo(filePath);
    console.log('MOBI Info:', {
      drmOffset: mobiInfo.drmOffset,
      drmCount: mobiInfo.drmCount,
      drmSize: mobiInfo.drmSize,
      drmFlags: mobiInfo.drmFlags,
      hasEXTH: mobiInfo.hasEXTH
    });

    // Parse EXTH records if present
    if (mobiInfo.hasEXTH) {
      const exthOffset = mobiInfo.firstRecordOffset + mobiInfo.mobiHeaderLength + 16;
      const exthInfo = await parseEXTHRecords(filePath, exthOffset);

      console.log('EXTH Records:');
      if (exthInfo.records) {
        for (const [recordType, recordData] of Object.entries(exthInfo.records)) {
          const type = parseInt(recordType);
          let content = '';

          // Try to display content as string if possible
          try {
            content = recordData.toString('utf8').substring(0, 50);
            if (content.length === 50) content += '...';
          } catch (e) {
            content = `[Binary data, ${recordData.length} bytes]`;
          }

          console.log(`  Type ${type}: ${content}`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  const testFiles = [
    './test-files/一地鸡毛.azw3',
    './test-files/知乎盐系列 57 我是高频交易工程师 .mobi',
    './test-files/valid-book.mobi',
    './test-files/valid-book.azw3'
  ];

  for (const file of testFiles) {
    await debugMobiFile(file);
  }
}

main().catch(console.error);
