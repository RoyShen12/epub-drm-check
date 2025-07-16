# EPUB DRM Check

A high-performance, cross-platform CLI tool to detect DRM-protected eBook files in bulk. This tool can scan directories for EPUB, MOBI, AZW3, and AZW files and identify which ones are DRM-encrypted and cannot be opened normally.

## ✨ Features

- 🔍 **Multi-format Support**: Works with EPUB, MOBI, AZW3, and AZW formats
- 🔄 **Batch Scanning**: Scan all eBook files in specified directories
- 🔄 **Recursive Search**: Optionally scan subdirectories recursively
- ⚡ **High Performance**: Concurrent file processing with configurable concurrency
- 🔒 **Comprehensive DRM Detection**: Detects Adobe DRM, Amazon DRM, and more
- 📊 **Multiple Output Formats**: Text, JSON, and CSV report formats
- 🌍 **Cross-platform**: Works on Windows, macOS, and Linux
- 📈 **Progress Display**: Real-time scanning progress with progress bars
- 🧪 **Well Tested**: Comprehensive test suite with >80% code coverage
- 🚀 **Performance Benchmarks**: Built-in benchmarking tools

## 📚 Supported File Formats

### EPUB Format
- ✅ Standard EPUB 2.0/3.0 files
- 🔒 Adobe DRM (ADEPT) protection detection
- 🔒 Custom encryption scheme detection

### MOBI Format
- ✅ Standard Mobipocket files
- 🔒 Amazon DRM protection detection
- 🔒 PID encryption detection

### AZW/AZW3 Format
- ✅ Amazon Kindle proprietary formats
- 🔒 Amazon DRM protection detection
- 🔒 Kindle-specific encryption detection

## 🔬 DRM Detection Methods

This tool detects DRM protection using the following methods:

### EPUB File Detection
1. **ZIP Structure Validation**: Checks if the file is a valid ZIP format
2. **Encryption File Detection**: Looks for `META-INF/encryption.xml` and other DRM-related files
3. **Container File Verification**: Checks `META-INF/container.xml` integrity
4. **OPF File Analysis**: Verifies that content package files are readable

### MOBI/AZW File Detection
1. **File Header Validation**: Checks PalmDOC/MOBI magic signatures
2. **DRM Flag Detection**: Analyzes DRM-related fields in MOBI headers
3. **EXTH Record Analysis**: Examines extended headers for DRM information
4. **Encrypted Record Detection**: Identifies encrypted text records

## 🚀 Installation

### Prerequisites

- Node.js 14.0.0 or higher

### Installation Steps

1. Clone or download the project:
```bash
git clone <repository-url>
cd epub-drm-check
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Install globally:
```bash
npm install -g .
```

## 📖 Usage

### Basic Usage

```bash
# Scan specified directory (supports EPUB, MOBI, AZW3 formats)
node src/index.js /path/to/ebook/directory

# If globally installed
epub-drm-check /path/to/ebook/directory
```

### Advanced Options

```bash
# Recursive subdirectory scanning (enabled by default)
epub-drm-check /path/to/directory --recursive

# Set concurrency level (default: 10)
epub-drm-check /path/to/directory --concurrency 5

# Generate JSON report
epub-drm-check /path/to/directory --output report.json --format json

# Generate CSV report
epub-drm-check /path/to/directory --output report.csv --format csv

# Verbose output with detailed information
epub-drm-check /path/to/directory --verbose

# Non-recursive scan (current directory only)
epub-drm-check /path/to/directory --recursive false
```

### Complete Command Reference

```bash
Usage: epub-drm-check [options] <directory>

CLI tool to detect DRM-protected EPUB, MOBI, and AZW3 files

Arguments:
  directory                    Directory to scan for eBook files

Options:
  -V, --version               display version number
  -r, --recursive             Scan subdirectories recursively (default: true)
  -o, --output <file>         Output report to file (optional)
  -f, --format <type>         Output format (json|csv|txt) (default: "txt")
  -c, --concurrency <number>  Number of concurrent file checks (default: "10")
  -v, --verbose               Verbose output
  -h, --help                  display help for command
```

## 🧪 Testing and Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Benchmarking Performance

```bash
# Run performance benchmarks
npm run benchmark
```

This will test different concurrency levels and show optimal performance settings for your system.

### Examples and Demonstrations

```bash
# Run examples to see various usage patterns
npm run examples
```

This demonstrates all major features with real output examples.

## 📊 Output Examples

### Console Output

```
🔍 Scanning directory: /Users/example/Books
📚 Found 250 eBook files
Checking DRM |████████████████████| 100% | 250/250

📊 Scan Results:

🔒 DRM-Protected Files:
  1. Protected_Book.epub
     Path: /Users/example/Books/Protected_Book.epub
     Size: 2.5 MB
     DRM Type: Adobe DRM (encryption.xml found)

  2. Kindle_Book.azw3
     Path: /Users/example/Books/Kindle_Book.azw3
     Size: 3.2 MB
     DRM Type: Amazon DRM (DRM offset present)

✅ Readable Files: 248

📊 Summary:
  Total eBook files: 250
  DRM-protected: 2
  Readable: 248
  Errors: 0
```

### JSON Report Format

```json
{
  "scanDate": "2025-07-16T02:30:00.000Z",
  "summary": {
    "totalFiles": 250,
    "drmProtected": 5,
    "readable": 245,
    "errors": 0
  },
  "files": [
    {
      "fileName": "example.epub",
      "filePath": "/path/to/example.epub",
      "fileType": "epub",
      "fileSize": 2621440,
      "fileSizeFormatted": "2.5 MB",
      "isDRMProtected": false,
      "drmType": null,
      "details": {
        "fileFormat": "epub"
      },
      "error": null,
      "checkTime": "2025-07-16T02:30:01.000Z"
    },
    {
      "fileName": "kindle-book.azw3",
      "filePath": "/path/to/kindle-book.azw3",
      "fileType": "azw3",
      "isDRMProtected": true,
      "drmType": "Amazon DRM (DRM offset present)",
      "details": {
        "fileFormat": "mobi",
        "drmOffset": 1024,
        "drmCount": 2,
        "drmSize": 128
      }
    }
  ]
}
```

## ⚡ Performance Optimization

- **Concurrency Control**: Default concurrency of 10, adjustable based on system performance
- **Memory Efficiency**: Only reads necessary file headers and key files, doesn't fully decompress
- **Error Handling**: Continues processing other files when encountering corrupted files
- **Progress Display**: Real-time progress display for monitoring long-running tasks

## 🔒 Supported DRM Types

### EPUB Format DRM
- Adobe DRM (ADEPT)
- Custom encryption schemes
- Corrupted or invalid ZIP structures
- Missing critical EPUB files

### MOBI/AZW Format DRM
- Amazon DRM (Kindle)
- PID-based encryption
- EXTH record encryption
- Custom Mobipocket protection

## 🛠️ Architecture

The tool is built with a modular architecture:

- **`src/index.js`** - Main CLI interface
- **`src/scanner.js`** - Directory scanning and file discovery
- **`src/detector.js`** - Core DRM detection logic
- **`src/utils.js`** - Utility functions for file format detection
- **`src/reporter.js`** - Output formatting and report generation
- **`tests/`** - Comprehensive test suite
- **`benchmark.js`** - Performance testing tools
- **`examples.js`** - Usage examples and demonstrations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Issue**: "No supported eBook files found"
- **Solution**: Ensure the directory contains .epub, .mobi, .azw3, or .azw files

**Issue**: High memory usage with large directories
- **Solution**: Reduce concurrency with `--concurrency 5` or lower

**Issue**: False positives for DRM detection
- **Solution**: Use `--verbose` to see detailed detection information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Node.js and modern JavaScript
- Uses ADM-ZIP for EPUB file handling
- Progress bars powered by cli-progress
- Cross-platform compatibility with chalk and commander
- Testing framework powered by Jest

---

**Note**: This tool is for legitimate use only. Respect copyright laws and only use on eBooks you own or have permission to analyze.

### MOBI/AZW格式DRM
- Amazon Kindle DRM
- PID (Personal ID) 加密
- EXTH记录中的DRM标识
- DRM偏移量和标志位

### 通用检测
- 文件格式损坏
- 不支持的文件格式
- 文件访问权限问题

## 故障排除

### 常见问题

1. **"Not a ZIP file"错误**: 这通常表示文件被DRM保护或损坏
2. **权限错误**: 确保对目标目录有读取权限
3. **内存不足**: 减少并发数量参数

### 调试模式

使用`--verbose`选项获取详细的错误信息：

```bash
epub-drm-check /path/to/directory --verbose
```

## 系统要求

- **操作系统**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Node.js**: 14.0.0+
- **内存**: 最少512MB可用内存
- **磁盘空间**: 取决于扫描的文件数量

## 依赖库

- `yauzl`: ZIP文件解析
- `commander`: 命令行参数解析
- `chalk`: 控制台颜色输出
- `cli-progress`: 进度条显示
- `p-limit`: 并发控制

## 贡献

欢迎提交Bug报告和功能请求！

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本DRM检测
- 多格式报告输出
- 跨平台支持
