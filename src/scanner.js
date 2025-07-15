const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const pLimit = require('p-limit');
const DRMDetector = require('./detector');

class Scanner {
  constructor(options = {}) {
    this.recursive = options.recursive !== false;
    this.concurrency = options.concurrency || 10;
    this.verbose = options.verbose || false;
    this.detector = new DRMDetector();
    this.progressBar = null;
  }

  async scan(directory) {
    console.log(chalk.blue('🔍 Finding EPUB files...'));

    // Find all EPUB files
    const epubFiles = await this.findEpubFiles(directory);

    if (epubFiles.length === 0) {
      console.log(chalk.yellow('No EPUB files found in the specified directory.'));
      return [];
    }

    console.log(chalk.blue(`📚 Found ${epubFiles.length} EPUB files`));

    // Initialize progress bar
    this.progressBar = new cliProgress.SingleBar({
      format: 'Checking DRM |{bar}| {percentage}% | {value}/{total} | {filename}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: true
    });

    this.progressBar.start(epubFiles.length, 0, { filename: 'Starting...' });

    // Process files with concurrency limit
    const limit = pLimit(this.concurrency);
    const results = [];
    let completed = 0;

    const promises = epubFiles.map(filePath =>
      limit(async () => {
        const result = await this.checkFile(filePath);
        completed++;
        this.progressBar.update(completed, {
          filename: path.basename(filePath).substring(0, 30) + '...'
        });
        return result;
      })
    );

    const allResults = await Promise.all(promises);
    this.progressBar.stop();

    return allResults;
  }

  async findEpubFiles(directory) {
    const epubFiles = [];
    await this.findEpubFilesRecursive(directory, epubFiles);
    return epubFiles;
  }

  async findEpubFilesRecursive(directory, epubFiles) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          if (this.recursive) {
            await this.findEpubFilesRecursive(fullPath, epubFiles);
          }
        } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.epub') {
          epubFiles.push(fullPath);
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.error(chalk.yellow(`Warning: Cannot access directory ${directory}: ${error.message}`));
      }
    }
  }

  async checkFile(filePath) {
    const result = {
      filePath,
      fileName: path.basename(filePath),
      fileSize: 0,
      isDRMProtected: false,
      drmType: null,
      error: null,
      checkTime: new Date().toISOString()
    };

    try {
      // Get file stats
      const stats = await fs.stat(filePath);
      result.fileSize = stats.size;

      // Check for DRM
      const drmInfo = await this.detector.checkDRM(filePath);
      result.isDRMProtected = drmInfo.isDRMProtected;
      result.drmType = drmInfo.drmType;
      result.details = drmInfo.details;

      if (this.verbose && result.isDRMProtected) {
        console.log(chalk.red(`\n🔒 DRM detected: ${result.fileName} (${result.drmType})`));
      }

    } catch (error) {
      result.error = error.message;
      if (this.verbose) {
        console.error(chalk.yellow(`\n⚠️  Error checking ${result.fileName}: ${error.message}`));
      }
    }

    return result;
  }
}

module.exports = Scanner;
