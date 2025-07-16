const Detector = require('../src/detector');
const path = require('path');

describe('DRM Detector', () => {
  let detector;

  beforeEach(() => {
    detector = new Detector();
  });

  describe('EPUB Detection', () => {
    test('should detect DRM-protected EPUB', async () => {
      const testFile = path.join(__dirname, '../test-files/drm-protected.epub');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(true);
      expect(result.drmType).toContain('Adobe DRM');
    });

    test('should detect clean EPUB', async () => {
      const testFile = path.join(__dirname, '../test-files/valid-book.epub');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(false);
    });

    test('should handle invalid EPUB', async () => {
      const testFile = path.join(__dirname, '../test-files/invalid.epub');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(true); // Invalid files are considered "protected"
    });
  });

  describe('MOBI/AZW3 Detection', () => {
    test('should detect DRM-protected MOBI', async () => {
      const testFile = path.join(__dirname, '../test-files/drm-protected.mobi');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(true);
      expect(result.drmType).toContain('Amazon DRM');
    });

    test('should detect clean MOBI', async () => {
      const testFile = path.join(__dirname, '../test-files/valid-book.mobi');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(false);
    });

    test('should detect DRM-protected AZW3', async () => {
      const testFile = path.join(__dirname, '../test-files/drm-protected.azw3');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(true);
      expect(result.drmType).toContain('Amazon DRM');
    });

    test('should detect clean AZW3', async () => {
      const testFile = path.join(__dirname, '../test-files/valid-book.azw3');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent files', async () => {
      const testFile = path.join(__dirname, '../test-files/nonexistent.epub');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(true);
      // Could be either error type depending on how the file access fails
      expect(['File access error', 'Unsupported or corrupted file format']).toContain(result.drmType);
    });

    test('should handle unsupported file types', async () => {
      const testFile = path.join(__dirname, '../package.json');
      const result = await detector.checkDRM(testFile);

      expect(result.isDRMProtected).toBe(true);
      expect(result.drmType).toBe('Unsupported or corrupted file format');
    });
  });
});
