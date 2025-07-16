#!/usr/bin/env node

const { performance } = require('perf_hooks');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const Scanner = require('./src/scanner');

/**
 * Benchmark script to test performance of the DRM detection tool
 */
class Benchmark {
  constructor() {
    this.results = [];
  }

  async run() {
    console.log(chalk.blue('📊 Starting ePub DRM Check Benchmark\n'));

    const testDir = path.join(__dirname, 'test-files');

    // Verify test directory exists
    try {
      await fs.access(testDir);
    } catch (error) {
      console.error(chalk.red('❌ Test files directory not found. Please run this from the project root.'));
      process.exit(1);
    }

    // Test different concurrency levels
    const concurrencyLevels = [1, 2, 5, 10, 20];

    for (const concurrency of concurrencyLevels) {
      await this.benchmarkConcurrency(testDir, concurrency);
    }

    this.printResults();
  }

  async benchmarkConcurrency(testDir, concurrency) {
    console.log(chalk.yellow(`🔧 Testing concurrency level: ${concurrency}`));

    const scanner = new Scanner({
      recursive: true,
      concurrency: concurrency,
      verbose: false
    });

    // Warm up run (don't measure this)
    await scanner.scan(testDir);

    // Measured runs
    const runTimes = [];
    const numRuns = 3; // Number of runs to average

    for (let i = 0; i < numRuns; i++) {
      const startTime = performance.now();
      const results = await scanner.scan(testDir);
      const endTime = performance.now();

      const runTime = endTime - startTime;
      runTimes.push(runTime);

      console.log(chalk.gray(`  Run ${i + 1}: ${runTime.toFixed(2)}ms (${results.length} files)`));
    }

    const avgTime = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;
    const minTime = Math.min(...runTimes);
    const maxTime = Math.max(...runTimes);

    this.results.push({
      concurrency,
      avgTime: avgTime.toFixed(2),
      minTime: minTime.toFixed(2),
      maxTime: maxTime.toFixed(2),
      numFiles: (await scanner.scan(testDir)).length
    });

    console.log(chalk.green(`  ✅ Average: ${avgTime.toFixed(2)}ms\n`));
  }

  printResults() {
    console.log(chalk.blue('\n📋 Benchmark Results Summary:\n'));

    console.log(chalk.white('Concurrency | Avg Time  | Min Time  | Max Time  | Files'));
    console.log(chalk.gray('------------|-----------|-----------|-----------|------'));

    this.results.forEach(result => {
      const { concurrency, avgTime, minTime, maxTime, numFiles } = result;
      console.log(chalk.white(
        `${concurrency.toString().padStart(11)} | ` +
        `${avgTime.padStart(8)}ms | ` +
        `${minTime.padStart(8)}ms | ` +
        `${maxTime.padStart(8)}ms | ` +
        `${numFiles.toString().padStart(5)}`
      ));
    });

    // Find optimal concurrency
    const fastest = this.results.reduce((best, current) =>
      parseFloat(current.avgTime) < parseFloat(best.avgTime) ? current : best
    );

    console.log(chalk.green(`\n🏆 Optimal concurrency level: ${fastest.concurrency} (${fastest.avgTime}ms average)`));

    // Memory usage
    const memUsage = process.memoryUsage();
    console.log(chalk.blue('\n💾 Memory Usage:'));
    console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new Benchmark();
  benchmark.run().catch(error => {
    console.error(chalk.red('❌ Benchmark failed:'), error.message);
    process.exit(1);
  });
}

module.exports = Benchmark;
