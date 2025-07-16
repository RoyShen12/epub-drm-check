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

/**
 * Check if a file is a valid MOBI/AZW file by reading its header
 * @param {string} filePath - Path to the file to check
 * @returns {Promise<{isValid: boolean, format: string, version?: string}>}
 */
async function checkMobiFormat(filePath) {
  try {
    const buffer = Buffer.alloc(232); // Read enough for MOBI header
    const fileHandle = await fs.open(filePath, 'r');

    try {
      const { bytesRead } = await fileHandle.read(buffer, 0, 232, 0);

      if (bytesRead < 78) {
        return { isValid: false, format: 'unknown' };
      }

      // Check PalmDOC header
      const palmDocIdentifier = buffer.toString('ascii', 60, 68);

      if (palmDocIdentifier === 'BOOKMOBI') {
        // Check MOBI version
        const mobiHeaderLength = buffer.readUInt32BE(20);
        return {
          isValid: true,
          format: 'mobi',
          headerLength: mobiHeaderLength
        };
      } else if (palmDocIdentifier === 'TPZ3TPZ3') {
        return {
          isValid: true,
          format: 'azw3'
        };
      } else {
        // Check for other AZW variants
        const identifier = buffer.toString('ascii', 60, 64);
        if (identifier === 'BOOK') {
          return {
            isValid: true,
            format: 'azw'
          };
        }
      }

      return { isValid: false, format: 'unknown' };

    } finally {
      await fileHandle.close();
    }
  } catch (error) {
    return { isValid: false, format: 'unknown', error: error.message };
  }
}

/**
 * Read MOBI/AZW DRM information from file header
 * @param {string} filePath - Path to the MOBI/AZW file
 * @returns {Promise<Object>} - DRM information
 */
async function readMobiDRMInfo(filePath) {
  try {
    const buffer = Buffer.alloc(1024); // Read first 1KB for headers
    const fileHandle = await fs.open(filePath, 'r');

    try {
      const { bytesRead } = await fileHandle.read(buffer, 0, 1024, 0);

      if (bytesRead < 232) {
        return { error: 'File too small to be valid MOBI' };
      }

      // Parse PalmDOC header
      const numRecords = buffer.readUInt16BE(76);
      const firstRecordOffset = buffer.readUInt32BE(78);

      // Read MOBI header from first record
      const mobiBuffer = Buffer.alloc(232);
      const { bytesRead: mobiBytes } = await fileHandle.read(mobiBuffer, 0, 232, firstRecordOffset);

      if (mobiBytes < 232) {
        return { error: 'Cannot read MOBI header' };
      }

      // Check MOBI signature
      const mobiSignature = mobiBuffer.toString('ascii', 16, 20);
      if (mobiSignature !== 'MOBI') {
        return { error: 'Invalid MOBI signature' };
      }

      // Read DRM-related fields
      const drmOffset = mobiBuffer.readUInt32BE(168); // DRM offset
      const drmCount = mobiBuffer.readUInt32BE(172);  // DRM count
      const drmSize = mobiBuffer.readUInt32BE(176);   // DRM size
      const drmFlags = mobiBuffer.readUInt32BE(180);  // DRM flags

      // Check for EXTH header (contains additional DRM info)
      const exthFlag = mobiBuffer.readUInt32BE(128);
      const hasEXTH = (exthFlag & 0x40) !== 0;

      return {
        numRecords,
        firstRecordOffset,
        drmOffset,
        drmCount,
        drmSize,
        drmFlags,
        hasEXTH,
        mobiHeaderLength: mobiBuffer.readUInt32BE(20)
      };

    } finally {
      await fileHandle.close();
    }
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Parse EXTH records for DRM information
 * @param {string} filePath - Path to the file
 * @param {number} exthOffset - Offset to EXTH header
 * @returns {Promise<Object>} - EXTH DRM information
 */
async function parseEXTHRecords(filePath, exthOffset) {
  try {
    const fileHandle = await fs.open(filePath, 'r');

    try {
      const exthBuffer = Buffer.alloc(12); // EXTH header is 12 bytes
      await fileHandle.read(exthBuffer, 0, 12, exthOffset);

      const exthSignature = exthBuffer.toString('ascii', 0, 4);
      if (exthSignature !== 'EXTH') {
        return { error: 'Invalid EXTH signature' };
      }

      const exthLength = exthBuffer.readUInt32BE(4);
      const recordCount = exthBuffer.readUInt32BE(8);

      // Read all EXTH records
      const recordsBuffer = Buffer.alloc(exthLength - 12);
      await fileHandle.read(recordsBuffer, 0, exthLength - 12, exthOffset + 12);

      const records = {};
      let offset = 0;

      for (let i = 0; i < recordCount && offset < recordsBuffer.length - 8; i++) {
        const recordType = recordsBuffer.readUInt32BE(offset);
        const recordLength = recordsBuffer.readUInt32BE(offset + 4);

        if (recordLength > 8 && offset + recordLength <= recordsBuffer.length) {
          const recordData = recordsBuffer.slice(offset + 8, offset + recordLength);
          records[recordType] = recordData;
        }

        offset += recordLength;
      }

      return { records, recordCount };

    } finally {
      await fileHandle.close();
    }
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Detect file format based on file extension and magic bytes
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - File format (epub, mobi, azw3, azw, unknown)
 */
async function detectFileFormat(filePath) {
  const ext = require('path').extname(filePath).toLowerCase();

  // Quick check based on extension
  if (ext === '.epub') {
    const zipValid = await isValidZip(filePath);
    return zipValid ? 'epub' : 'unknown';
  }

  if (ext === '.mobi' || ext === '.azw3' || ext === '.azw') {
    const mobiInfo = await checkMobiFormat(filePath);
    return mobiInfo.isValid ? mobiInfo.format : 'unknown';
  }

  return 'unknown';
}

module.exports = {
  isValidZip,
  readZipEntry,
  formatFileSize,
  sanitizeFilename,
  getRelativePath,
  sleep,
  isValidXML,
  checkMobiFormat,
  readMobiDRMInfo,
  parseEXTHRecords,
  detectFileFormat
};
