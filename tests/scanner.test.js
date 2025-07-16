const Scanner = require('../src/scanner');
const path = require('path');

describe('Scanner', () => {
  let scanner;

  beforeEach(() => {
    scanner = new Scanner({
      recursive: true,
      concurrency: 2,
      verbose: false
    });
  });

  describe('File Discovery', () => {
    test('should find all test files', async () => {
      const testDir = path.join(__dirname, '../test-files');
      const results = await scanner.scan(testDir);

      expect(results.length).toBeGreaterThan(0);

      // Should find EPUB, MOBI, and AZW3 files
      const fileTypes = results.map(r => path.extname(r.fileName).toLowerCase());
      expect(fileTypes).toContain('.epub');
      expect(fileTypes).toContain('.mobi');
      expect(fileTypes).toContain('.azw3');
    });

    test('should handle empty directories', async () => {
      const emptyDir = path.join(__dirname, 'empty-test-dir');
      // Create empty directory for test
      const fs = require('fs').promises;
      await fs.mkdir(emptyDir, { recursive: true });

      const results = await scanner.scan(emptyDir);
      expect(results).toEqual([]);

      // Cleanup
      await fs.rmdir(emptyDir);
    });
  });

  describe('Configuration', () => {
    test('should respect concurrency setting', () => {
      const scanner1 = new Scanner({ concurrency: 1 });
      const scanner2 = new Scanner({ concurrency: 10 });

      expect(scanner1.concurrency).toBe(1);
      expect(scanner2.concurrency).toBe(10);
    });

    test('should respect recursive setting', () => {
      const scanner1 = new Scanner({ recursive: false });
      const scanner2 = new Scanner({ recursive: true });

      expect(scanner1.recursive).toBe(false);
      expect(scanner2.recursive).toBe(true);
    });
  });
});
