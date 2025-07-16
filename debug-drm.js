#!/usr/bin/env node

const path = require('path');
const DRMDetector = require('./src/detector');

async function debugDRMDetection(filePath) {
  console.log(`\n=== Debugging DRM Detection: ${path.basename(filePath)} ===`);

  const detector = new DRMDetector();

  try {
    const result = await detector.checkDRM(filePath);
    console.log('DRM Detection Result:', {
      isDRMProtected: result.isDRMProtected,
      drmType: result.drmType,
      details: result.details
    });

    // If DRM records were found, show them in detail
    if (result.details && result.details.drmRecords) {
      console.log('DRM Records found:');
      result.details.drmRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. Type ${record.type} (${record.name}):`, {
          content: record.content,
          size: record.size
        });
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  const testFiles = [
    './test-files/一地鸡毛.azw3',
    './test-files/知乎盐系列 57 我是高频交易工程师 .mobi'
  ];

  for (const file of testFiles) {
    await debugDRMDetection(file);
  }
}

main().catch(console.error);
