#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');

/**
 * Examples script to demonstrate various usage patterns of epub-drm-check
 */
class ExamplesRunner {
  constructor() {
    this.exampleDir = path.join(__dirname, 'test-files');
  }

  async run() {
    console.log(chalk.blue('📚 epub-drm-check Examples and Demonstrations\n'));

    await this.verifyTestFiles();

    const examples = [
      {
        title: 'Basic scan of test directory',
        description: 'Scan all eBook files in the test-files directory',
        command: `node src/index.js test-files`
      },
      {
        title: 'Verbose output with detailed information',
        description: 'Show detailed DRM detection information',
        command: `node src/index.js test-files --verbose`
      },
      {
        title: 'Export results to JSON format',
        description: 'Save scan results to a JSON file for programmatic use',
        command: `node src/index.js test-files --format json --output results.json`
      },
      {
        title: 'Export results to CSV format',
        description: 'Save results in CSV format for spreadsheet applications',
        command: `node src/index.js test-files --format csv --output results.csv`
      },
      {
        title: 'High-performance scan with increased concurrency',
        description: 'Process 20 files simultaneously for faster scanning',
        command: `node src/index.js test-files --concurrency 20`
      },
      {
        title: 'Non-recursive scan (current directory only)',
        description: 'Scan only the specified directory, not subdirectories',
        command: `node src/index.js test-files --recursive false`
      },
      {
        title: 'Save TXT report with custom filename',
        description: 'Generate a human-readable text report',
        command: `node src/index.js test-files --format txt --output my-drm-report.txt`
      }
    ];

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      await this.runExample(i + 1, example);

      if (i < examples.length - 1) {
        console.log(chalk.gray('\n' + '─'.repeat(60) + '\n'));
      }
    }

    await this.cleanupExampleFiles();
    this.printUsageTips();
  }

  async verifyTestFiles() {
    try {
      const files = await fs.readdir(this.exampleDir);
      const eBookFiles = files.filter(f =>
        f.endsWith('.epub') || f.endsWith('.mobi') || f.endsWith('.azw3') || f.endsWith('.azw')
      );

      if (eBookFiles.length === 0) {
        throw new Error('No test files found');
      }

      console.log(chalk.green(`✅ Found ${eBookFiles.length} test eBook files\n`));
    } catch (error) {
      console.error(chalk.red('❌ Test files not available. Please ensure test-files directory exists.'));
      process.exit(1);
    }
  }

  async runExample(num, example) {
    console.log(chalk.cyan(`Example ${num}: ${example.title}`));
    console.log(chalk.gray(`Description: ${example.description}`));
    console.log(chalk.yellow(`Command: ${example.command}\n`));

    try {
      console.log(chalk.white('Output:'));
      const output = execSync(example.command, {
        encoding: 'utf8',
        cwd: __dirname,
        stdio: 'pipe'
      });

      // Truncate very long output
      const lines = output.split('\n');
      const maxLines = 15;
      if (lines.length > maxLines) {
        console.log(lines.slice(0, maxLines).join('\n'));
        console.log(chalk.gray(`... (${lines.length - maxLines} more lines)`));
      } else {
        console.log(output);
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
  }

  async cleanupExampleFiles() {
    const outputFiles = ['results.json', 'results.csv', 'my-drm-report.txt'];

    for (const file of outputFiles) {
      try {
        await fs.unlink(file);
        console.log(chalk.gray(`🗑️  Cleaned up: ${file}`));
      } catch (error) {
        // File might not exist, ignore
      }
    }
  }

  printUsageTips() {
    console.log(chalk.blue('\n💡 Usage Tips:\n'));

    const tips = [
      'Use --concurrency to control how many files are processed simultaneously',
      'JSON output is perfect for integrating with other tools or scripts',
      'CSV output can be opened in Excel, Google Sheets, or other spreadsheet apps',
      'Use --verbose for debugging or detailed analysis of DRM detection',
      'The tool works with EPUB, MOBI, AZW3, and AZW file formats',
      'Recursive scanning is enabled by default but can be disabled',
      'Progress bars show real-time scanning status for large directories'
    ];

    tips.forEach((tip, index) => {
      console.log(`${index + 1}. ${tip}`);
    });

    console.log(chalk.green('\n🎯 For more information, run: node src/index.js --help'));
  }
}

// Run examples if called directly
if (require.main === module) {
  const runner = new ExamplesRunner();
  runner.run().catch(error => {
    console.error(chalk.red('❌ Examples failed:'), error.message);
    process.exit(1);
  });
}

module.exports = ExamplesRunner;
