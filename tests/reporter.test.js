const Reporter = require('../src/reporter');
const path = require('path');
const fs = require('fs').promises;

describe('Reporter', () => {
  const sampleResults = [
    {
      fileName: 'test1.epub',
      filePath: '/path/to/test1.epub',
      fileSize: 1024,
      isDRMProtected: true,
      drmType: 'Adobe DRM',
      error: null
    },
    {
      fileName: 'test2.mobi',
      filePath: '/path/to/test2.mobi',
      fileSize: 2048,
      isDRMProtected: false,
      drmType: null,
      error: null
    },
    {
      fileName: 'test3.azw3',
      filePath: '/path/to/test3.azw3',
      fileSize: 512,
      isDRMProtected: true,
      drmType: 'Amazon DRM',
      error: null
    }
  ];

  describe('Console Output', () => {
    test('should generate console output without errors', () => {
      const reporter = new Reporter('txt');

      // Capture console output
      const originalLog = console.log;
      let output = '';
      console.log = (str) => { output += str + '\n'; };

      expect(() => {
        reporter.printToConsole(sampleResults);
      }).not.toThrow();

      // Restore console.log
      console.log = originalLog;

      expect(output).toContain('Scan Results');
      expect(output).toContain('DRM-Protected Files');
      expect(output).toContain('Readable Files');
    });
  });

  describe('File Output', () => {
    const testOutputDir = path.join(__dirname, 'test-output');

    beforeEach(async () => {
      await fs.mkdir(testOutputDir, { recursive: true });
    });

    afterEach(async () => {
      try {
        await fs.rm(testOutputDir, { recursive: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    test('should save JSON report', async () => {
      const reporter = new Reporter('json');
      const outputFile = path.join(testOutputDir, 'test-report.json');

      await reporter.saveToFile(sampleResults, outputFile);

      const fileExists = await fs.access(outputFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(outputFile, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.summary.totalFiles).toBe(3);
      expect(parsed.summary.drmProtected).toBe(2);
    });

    test('should save CSV report', async () => {
      const reporter = new Reporter('csv');
      const outputFile = path.join(testOutputDir, 'test-report.csv');

      await reporter.saveToFile(sampleResults, outputFile);

      const fileExists = await fs.access(outputFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(outputFile, 'utf8');
      expect(content).toContain('File Name,File Path');
      expect(content).toContain('test1.epub');
      expect(content).toContain('test2.mobi');
    });

    test('should save TXT report', async () => {
      const reporter = new Reporter('txt');
      const outputFile = path.join(testOutputDir, 'test-report.txt');

      await reporter.saveToFile(sampleResults, outputFile);

      const fileExists = await fs.access(outputFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(outputFile, 'utf8');
      expect(content).toContain('eBook DRM Check Report');
      expect(content).toContain('DRM-PROTECTED FILES');
    });
  });

  describe('Format Validation', () => {
    test('should handle valid formats', () => {
      expect(() => new Reporter('json')).not.toThrow();
      expect(() => new Reporter('csv')).not.toThrow();
      expect(() => new Reporter('txt')).not.toThrow();
    });

    test('should keep format as provided', () => {
      const reporter = new Reporter('invalid');
      expect(reporter.format).toBe('invalid');
    });
  });
});
