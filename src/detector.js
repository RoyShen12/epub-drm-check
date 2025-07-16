const fs = require('fs').promises;
const AdmZip = require('adm-zip');
const { isValidZip, detectFileFormat, readMobiDRMInfo, parseEXTHRecords } = require('./utils');

class DRMDetector {
  constructor() {
    // No need for promisify with adm-zip
  }

  async checkDRM(filePath) {
    const result = {
      isDRMProtected: false,
      drmType: null,
      details: {}
    };

    try {
      // Detect file format first
      const fileFormat = await detectFileFormat(filePath);
      result.details.fileFormat = fileFormat;

      switch (fileFormat) {
        case 'epub':
          return await this.checkEPUBDRM(filePath, result);
        case 'mobi':
        case 'azw':
        case 'azw3':
          return await this.checkMOBIDRM(filePath, result);
        default:
          result.isDRMProtected = true;
          result.drmType = 'Unsupported or corrupted file format';
          result.details.reason = `File format '${fileFormat}' is not supported or file is corrupted`;
          return result;
      }

    } catch (error) {
      result.isDRMProtected = true;
      result.drmType = 'File access error';
      result.details.error = error.message;
      return result;
    }
  }

  async checkEPUBDRM(filePath, result) {
    try {
      // First, check if the file is a valid ZIP
      const isValidZipFile = await isValidZip(filePath);
      if (!isValidZipFile) {
        result.isDRMProtected = true;
        result.drmType = 'Invalid ZIP structure';
        result.details.reason = 'File is not a valid ZIP archive';
        return result;
      }

      // Try to open as ZIP and check contents
      const zip = new AdmZip(filePath);
      const entries = zip.getEntries();

      // Check for encryption indicators
      const drmCheck = this.analyzeZipContents(entries, zip);
      if (drmCheck.isDRMProtected) {
        result.isDRMProtected = true;
        result.drmType = drmCheck.drmType;
        result.details = { ...result.details, ...drmCheck.details };
      }

    } catch (error) {
      // If we can't open the file as ZIP, it might be DRM protected
      if (error.message.includes('invalid signature') ||
          error.message.includes('not a zip file') ||
          error.message.includes('encrypted') ||
          error.message.includes('invalid central directory') ||
          error.message.includes('malformed')) {
        result.isDRMProtected = true;
        result.drmType = 'Encrypted or corrupted EPUB';
        result.details.error = error.message;
      } else {
        throw error; // Re-throw unexpected errors
      }
    }

    return result;
  }

  async checkMOBIDRM(filePath, result) {
    try {
      // Read MOBI DRM information
      const mobiInfo = await readMobiDRMInfo(filePath);

      if (mobiInfo.error) {
        result.isDRMProtected = true;
        result.drmType = 'Invalid MOBI format';
        result.details.reason = mobiInfo.error;
        return result;
      }

      // Check DRM indicators
      const hasDRM = this.analyzeMobiDRM(mobiInfo);
      if (hasDRM.isDRMProtected) {
        result.isDRMProtected = true;
        result.drmType = hasDRM.drmType;
        result.details = { ...result.details, ...hasDRM.details };
      }

      // Check EXTH records for additional DRM info
      if (mobiInfo.hasEXTH) {
        const exthOffset = mobiInfo.firstRecordOffset + mobiInfo.mobiHeaderLength + 16;
        const exthInfo = await parseEXTHRecords(filePath, exthOffset);

        if (exthInfo.records) {
          const exthDRM = this.analyzeEXTHRecords(exthInfo.records);
          if (exthDRM.isDRMProtected) {
            result.isDRMProtected = true;
            result.drmType = exthDRM.drmType;
            result.details = { ...result.details, ...exthDRM.details };
          }
        }
      }

    } catch (error) {
      result.isDRMProtected = true;
      result.drmType = 'MOBI/AZW access error';
      result.details.error = error.message;
    }

    return result;
  }

  analyzeZipContents(entries, zip) {
    const result = {
      isDRMProtected: false,
      drmType: null,
      details: {}
    };

    // Check for encryption.xml in META-INF
    const encryptionXml = entries.find(entry =>
      entry.entryName === 'META-INF/encryption.xml'
    );

    if (encryptionXml) {
      result.isDRMProtected = true;
      result.drmType = 'Adobe DRM (encryption.xml found)';
      result.details.encryptionFile = true;
      return result;
    }

    // Check for rights.xml (Adobe DRM)
    const rightsXml = entries.find(entry =>
      entry.entryName === 'META-INF/rights.xml'
    );

    if (rightsXml) {
      result.isDRMProtected = true;
      result.drmType = 'Adobe DRM (rights.xml found)';
      result.details.rightsFile = true;
      return result;
    }

    // Check for suspicious file extensions or patterns
    const suspiciousFiles = entries.filter(entry => {
      const fileName = entry.entryName.toLowerCase();
      return fileName.includes('.acsm') ||
             fileName.includes('drm') ||
             fileName.includes('license') ||
             fileName.endsWith('.epub.acsm');
    });

    if (suspiciousFiles.length > 0) {
      result.isDRMProtected = true;
      result.drmType = 'Suspicious DRM files detected';
      result.details.suspiciousFiles = suspiciousFiles.map(f => f.entryName);
      return result;
    }

    // Check if container.xml exists
    const containerXml = entries.find(entry =>
      entry.entryName === 'META-INF/container.xml'
    );

    if (!containerXml) {
      result.isDRMProtected = true;
      result.drmType = 'Missing container.xml';
      result.details.reason = 'Standard EPUB container.xml not found';
      return result;
    }

    // Try to read container.xml
    try {
      const containerContent = zip.readAsText(containerXml);

      if (!containerContent || containerContent.length === 0) {
        result.isDRMProtected = true;
        result.drmType = 'Empty container.xml';
        result.details.reason = 'container.xml exists but is empty';
        return result;
      }

      // Check if container.xml contains expected EPUB structure
      if (!containerContent.includes('urn:oasis:names:tc:opendocument:xmlns:container') &&
          !containerContent.includes('application/oebps-package+xml')) {
        result.isDRMProtected = true;
        result.drmType = 'Invalid container.xml';
        result.details.reason = 'container.xml does not contain standard EPUB metadata';
        return result;
      }

      // Extract OPF file path from container.xml
      const opfMatch = containerContent.match(/full-path=["']([^"']+\.opf)["']/);
      if (!opfMatch) {
        result.isDRMProtected = true;
        result.drmType = 'Invalid container.xml';
        result.details.reason = 'container.xml does not reference an OPF file';
        return result;
      }

      const opfPath = opfMatch[1];
      const opfEntry = entries.find(entry => entry.entryName === opfPath);

      if (!opfEntry) {
        result.isDRMProtected = true;
        result.drmType = 'Missing OPF file';
        result.details.reason = `Referenced OPF file ${opfPath} not found`;
        return result;
      }

      // If we get here, we have a valid EPUB structure
      result.details.containerValid = true;
      result.details.opfPath = opfPath;
      result.details.opfExists = true;

      return result; // isDRMProtected remains false

    } catch (error) {
      result.isDRMProtected = true;
      result.drmType = 'Unreadable container.xml';
      result.details.reason = `Cannot read container.xml: ${error.message}`;
      return result;
    }
  }

  analyzeMobiDRM(mobiInfo) {
    const result = {
      isDRMProtected: false,
      drmType: null,
      details: {}
    };

    // Check DRM offset - only consider it DRM if it's a valid, non-zero, non-default value
    if (mobiInfo.drmOffset &&
        mobiInfo.drmOffset !== 0 &&
        mobiInfo.drmOffset !== 0xFFFFFFFF &&
        mobiInfo.drmCount > 0) {
      result.isDRMProtected = true;
      result.drmType = 'Amazon DRM (DRM offset present)';
      result.details.drmOffset = mobiInfo.drmOffset;
      result.details.drmCount = mobiInfo.drmCount;
      result.details.drmSize = mobiInfo.drmSize;
      return result;
    }

    // Check DRM flags - only specific flag patterns indicate DRM
    if (mobiInfo.drmFlags && (mobiInfo.drmFlags & 0x01) !== 0) {
      result.isDRMProtected = true;
      result.drmType = 'Amazon DRM (DRM flags set)';
      result.details.drmFlags = mobiInfo.drmFlags;
      return result;
    }

    // Additional check: if DRM size is suspiciously large, it might indicate DRM
    if (mobiInfo.drmSize > 0 && mobiInfo.drmSize < 0xFFFFFFFF) {
      // Only flag as DRM if size is reasonable but present
      if (mobiInfo.drmSize > 32 && mobiInfo.drmSize < 10000) {
        result.isDRMProtected = true;
        result.drmType = 'Amazon DRM (DRM size present)';
        result.details.drmSize = mobiInfo.drmSize;
        return result;
      }
    }

    // Store info for debugging but don't flag as DRM
    result.details.numRecords = mobiInfo.numRecords;
    result.details.drmOffset = mobiInfo.drmOffset;
    result.details.drmFlags = mobiInfo.drmFlags;
    result.details.drmSize = mobiInfo.drmSize;

    return result;
  }

  analyzeEXTHRecords(records) {
    const result = {
      isDRMProtected: false,
      drmType: null,
      details: {}
    };

    // Known EXTH record types that may indicate DRM, but we need to check content
    const potentialDrmRecordTypes = {
      401: 'DRM Server ID',
      402: 'DRM Commerce ID',
      403: 'DRM eBookie ID',
      404: 'DRM User ID',
      405: 'DRM PID',
      407: 'DRM Server Token',
      501: 'Personal DRM Key'
    };

    const foundDRMRecords = [];

    for (const [recordType, recordData] of Object.entries(records)) {
      const type = parseInt(recordType);

      if (potentialDrmRecordTypes[type]) {
        // Check if the record actually contains DRM data
        const content = recordData.toString('utf8');

        // Skip if empty or contains only common non-DRM values
        if (content.length === 0 ||
            content === 'd' ||
            content === 'EBOK' ||
            content.trim() === '') {
          continue;
        }

        // Skip if content is all null bytes (common padding)
        if (recordData.every(byte => byte === 0)) {
          continue;
        }

        // For type 501, check if it's actually a DRM key vs just book type
        if (type === 501 && (content === 'EBOK' || content === 'PDOC' || content.length < 10)) {
          continue;
        }

        // For DRM Server/User IDs, they should be meaningful strings (not just padding)
        if ((type >= 401 && type <= 407) && (content.length < 8 || recordData.every(byte => byte === 0 || byte < 32))) {
          continue;
        }

        foundDRMRecords.push({
          type: type,
          name: potentialDrmRecordTypes[type],
          size: recordData.length,
          content: content.substring(0, 50) // Store first 50 chars for debugging
        });
      }
    }

    if (foundDRMRecords.length > 0) {
      result.isDRMProtected = true;
      result.drmType = 'Amazon DRM (EXTH records)';
      result.details.drmRecords = foundDRMRecords;
    }

    return result;
  }
}

module.exports = DRMDetector;
