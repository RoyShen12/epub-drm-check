#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs').promises;
const Scanner = require('./scanner');
const Reporter = require('./reporter');

const program = new Command();

program
  .name('epub-drm-check')
  .description('CLI tool to detect DRM-protected EPUB, MOBI, and AZW3 files')
  .version('1.2.0');

program
  .argument('<directory>', 'Directory to scan for eBook files (EPUB, MOBI, AZW3)')
  .option('-r, --recursive', 'Scan subdirectories recursively', true)
  .option('-o, --output <file>', 'Output report to file (optional)')
  .option('-f, --format <type>', 'Output format (json|csv|txt)', 'txt')
  .option('-c, --concurrency <number>', 'Number of concurrent file checks', '10')
  .option('-v, --verbose', 'Verbose output')
  .action(async (directory, options) => {
    try {
      // Validate directory
      const dirPath = path.resolve(directory);
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        console.error(chalk.red(`Error: ${directory} is not a directory`));
        process.exit(1);
      }

      console.log(chalk.blue(`🔍 Scanning directory: ${dirPath}`));
      console.log(chalk.gray(`Options: recursive=${options.recursive}, concurrency=${options.concurrency}, format=${options.format}`));

      // Initialize scanner
      const scanner = new Scanner({
        recursive: options.recursive,
        concurrency: parseInt(options.concurrency),
        verbose: options.verbose
      });

      // Scan for eBook files and check for DRM
      const results = await scanner.scan(dirPath);

      // Generate report
      const reporter = new Reporter(options.format);
      if (options.output) {
        await reporter.saveToFile(results, options.output);
        console.log(chalk.green(`\n📄 Report saved to: ${options.output}`));
      } else {
        reporter.printToConsole(results);
      }

      // Summary
      const total = results.length;
      const drmProtected = results.filter(r => r.isDRMProtected).length;
      const errors = results.filter(r => r.error).length;

      console.log(chalk.yellow('\n📊 Summary:'));
      console.log(`  Total eBook files: ${total}`);
      console.log(`  DRM-protected: ${chalk.red(drmProtected)}`);
      console.log(`  Readable: ${chalk.green(total - drmProtected - errors)}`);
      if (errors > 0) {
        console.log(`  Errors: ${chalk.yellow(errors)}`);
      }

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
