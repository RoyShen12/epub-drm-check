const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { formatFileSize, getRelativePath } = require('./utils');

class Reporter {
  constructor(format = 'txt') {
    this.format = format.toLowerCase();
  }

  printToConsole(results) {
    console.log(chalk.blue('\n📊 Scan Results:\n'));

    if (results.length === 0) {
      console.log(chalk.yellow('No EPUB files found.'));
      return;
    }

    // Group results
    const drmProtected = results.filter(r => r.isDRMProtected && !r.error);
    const readable = results.filter(r => !r.isDRMProtected && !r.error);
    const errors = results.filter(r => r.error);

    // Print DRM-protected files
    if (drmProtected.length > 0) {
      console.log(chalk.red('🔒 DRM-Protected Files:'));
      drmProtected.forEach((result, index) => {
        console.log(`  ${index + 1}. ${chalk.red(result.fileName)}`);
        console.log(`     Path: ${chalk.gray(result.filePath)}`);
        console.log(`     Size: ${chalk.cyan(formatFileSize(result.fileSize))}`);
        console.log(`     DRM Type: ${chalk.yellow(result.drmType)}`);
        if (result.details && result.details.reason) {
          console.log(`     Reason: ${chalk.gray(result.details.reason)}`);
        }
        console.log('');
      });
    }

    // Print readable files summary
    if (readable.length > 0) {
      console.log(chalk.green(`✅ Readable Files: ${readable.length}`));
      if (this.format === 'verbose') {
        readable.forEach((result, index) => {
          console.log(`  ${index + 1}. ${chalk.green(result.fileName)} (${formatFileSize(result.fileSize)})`);
        });
      }
      console.log('');
    }

    // Print errors
    if (errors.length > 0) {
      console.log(chalk.yellow('⚠️  Files with Errors:'));
      errors.forEach((result, index) => {
        console.log(`  ${index + 1}. ${chalk.yellow(result.fileName)}`);
        console.log(`     Error: ${chalk.red(result.error)}`);
        console.log('');
      });
    }
  }

  async saveToFile(results, outputPath) {
    const ext = path.extname(outputPath).toLowerCase();
    let format = this.format;

    // Auto-detect format from file extension if not specified
    if (ext === '.json') format = 'json';
    else if (ext === '.csv') format = 'csv';
    else if (ext === '.txt') format = 'txt';

    let content;
    switch (format) {
      case 'json':
        content = this.generateJSON(results);
        break;
      case 'csv':
        content = this.generateCSV(results);
        break;
      case 'txt':
      default:
        content = this.generateTXT(results);
        break;
    }

    await fs.writeFile(outputPath, content, 'utf8');
  }

  generateJSON(results) {
    const report = {
      scanDate: new Date().toISOString(),
      summary: {
        totalFiles: results.length,
        drmProtected: results.filter(r => r.isDRMProtected).length,
        readable: results.filter(r => !r.isDRMProtected && !r.error).length,
        errors: results.filter(r => r.error).length
      },
      files: results.map(result => ({
        fileName: result.fileName,
        filePath: result.filePath,
        fileSize: result.fileSize,
        fileSizeFormatted: formatFileSize(result.fileSize),
        isDRMProtected: result.isDRMProtected,
        drmType: result.drmType,
        details: result.details,
        error: result.error,
        checkTime: result.checkTime
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  generateCSV(results) {
    const headers = [
      'File Name',
      'File Path',
      'File Size (Bytes)',
      'File Size',
      'DRM Protected',
      'DRM Type',
      'Error',
      'Check Time'
    ];

    const rows = results.map(result => [
      this.escapeCSV(result.fileName),
      this.escapeCSV(result.filePath),
      result.fileSize,
      this.escapeCSV(formatFileSize(result.fileSize)),
      result.isDRMProtected ? 'Yes' : 'No',
      this.escapeCSV(result.drmType || ''),
      this.escapeCSV(result.error || ''),
      this.escapeCSV(result.checkTime)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  generateTXT(results) {
    const lines = [];
    lines.push('eBook DRM Check Report');
    lines.push('='.repeat(50));
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');

    // Summary
    const totalFiles = results.length;
    const drmProtected = results.filter(r => r.isDRMProtected).length;
    const readable = results.filter(r => !r.isDRMProtected && !r.error).length;
    const errors = results.filter(r => r.error).length;

    lines.push('SUMMARY:');
    lines.push(`  Total eBook files: ${totalFiles}`);
    lines.push(`  DRM-protected: ${drmProtected}`);
    lines.push(`  Readable: ${readable}`);
    lines.push(`  Errors: ${errors}`);
    lines.push('');

    // DRM-protected files
    const drmFiles = results.filter(r => r.isDRMProtected && !r.error);
    if (drmFiles.length > 0) {
      lines.push('DRM-PROTECTED FILES:');
      lines.push('-'.repeat(30));
      drmFiles.forEach((result, index) => {
        lines.push(`${index + 1}. ${result.fileName}`);
        lines.push(`   Path: ${result.filePath}`);
        lines.push(`   Size: ${formatFileSize(result.fileSize)}`);
        lines.push(`   DRM Type: ${result.drmType}`);
        if (result.details && result.details.reason) {
          lines.push(`   Reason: ${result.details.reason}`);
        }
        lines.push('');
      });
    }

    // Files with errors
    const errorFiles = results.filter(r => r.error);
    if (errorFiles.length > 0) {
      lines.push('FILES WITH ERRORS:');
      lines.push('-'.repeat(30));
      errorFiles.forEach((result, index) => {
        lines.push(`${index + 1}. ${result.fileName}`);
        lines.push(`   Path: ${result.filePath}`);
        lines.push(`   Error: ${result.error}`);
        lines.push('');
      });
    }

    // Readable files (summary only)
    const readableFiles = results.filter(r => !r.isDRMProtected && !r.error);
    if (readableFiles.length > 0) {
      lines.push('READABLE FILES:');
      lines.push('-'.repeat(30));
      lines.push(`${readableFiles.length} files are readable and not DRM-protected.`);
      lines.push('');
    }

    return lines.join('\n');
  }

  escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

module.exports = Reporter;
