const fs = require('fs').promises;

/**
 * Check if a file is a valid ZIP archive by reading its header
 * @param {string} filePath - Path to the file to check
 * @returns {Promise<boolean>} - True if file has valid ZIP signature
 */
async function isValidZip(filePath) {
  try {
    const buffer = Buffer.alloc(4);
    const fileHandle = await fs.open(filePath, 'r');

    try {
      const { bytesRead } = await fileHandle.read(buffer, 0, 4, 0);

      if (bytesRead < 4) {
        return false;
      }

      // Check for ZIP file signatures
      // Standard ZIP: PK\x03\x04 (0x504B0304)
      // Empty ZIP: PK\x05\x06 (0x504B0506)
      // Spanned ZIP: PK\x07\x08 (0x504B0708)
      const signature = buffer.readUInt32LE(0);

      return signature === 0x04034B50 || // Standard ZIP
             signature === 0x06054B50 || // Empty ZIP
             signature === 0x08074B50;   // Spanned ZIP

    } finally {
      await fileHandle.close();
    }
  } catch (error) {
    return false;
  }
}

/**
 * Read the contents of a ZIP entry
 * @param {Object} zipFile - The opened ZIP file object
 * @param {Object} entry - The ZIP entry to read
 * @returns {Promise<string>} - The entry content as string
 */
function readZipEntry(zipFile, entry) {
  return new Promise((resolve, reject) => {
    // Check if zipFile is still open
    if (zipFile.isOpen === false) {
      reject(new Error('ZIP file is closed'));
      return;
    }

    zipFile.openReadStream(entry, (error, readStream) => {
      if (error) {
        reject(error);
        return;
      }

      let content = '';
      let finished = false;

      const cleanup = () => {
        if (readStream && !readStream.destroyed) {
          readStream.destroy();
        }
      };

      const finishReading = (result) => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(result);
      };

      const finishWithError = (err) => {
        if (finished) return;
        finished = true;
        cleanup();
        reject(err);
      };

      readStream.setEncoding('utf8');

      readStream.on('data', (chunk) => {
        content += chunk;
      });

      readStream.on('end', () => {
        finishReading(content);
      });

      readStream.on('error', (error) => {
        finishWithError(error);
      });

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        finishWithError(new Error('Timeout reading ZIP entry'));
      }, 5000);

      // Clear timeout if we finish successfully
      readStream.on('end', () => {
        clearTimeout(timeout);
      });
      readStream.on('error', () => {
        clearTimeout(timeout);
      });
    });
  });
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Sanitize filename for safe file system operations
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255); // Limit length
}

/**
 * Get relative path from base directory
 * @param {string} filePath - Full file path
 * @param {string} basePath - Base directory path
 * @returns {string} - Relative path
 */
function getRelativePath(filePath, basePath) {
  const path = require('path');
  return path.relative(basePath, filePath);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a string is valid XML
 * @param {string} xmlString - XML string to validate
 * @returns {boolean} - True if valid XML
 */
function isValidXML(xmlString) {
  try {
    // Basic XML validation - check for basic structure
    const trimmed = xmlString.trim();
    return trimmed.startsWith('<') &&
           trimmed.endsWith('>') &&
           trimmed.includes('<?xml') || trimmed.match(/<[^>]+>/);
  } catch (error) {
    return false;
  }
}

module.exports = {
  isValidZip,
  readZipEntry,
  formatFileSize,
  sanitizeFilename,
  getRelativePath,
  sleep,
  isValidXML
};
