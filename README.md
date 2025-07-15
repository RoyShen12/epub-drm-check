# EPUB DRM Check

一个用于检测EPUB文件是否被DRM（数字版权管理）保护的命令行工具。此工具可以扫描目录中的所有EPUB文件，并识别出哪些文件被DRM加密而无法正常打开。

## 功能特性

- 🔍 **批量扫描**: 扫描指定目录下的所有EPUB文件
- 🔄 **递归搜索**: 支持递归扫描子目录
- ⚡ **高性能**: 并发处理多个文件，可配置并发数量
- 🔒 **多种DRM检测**: 检测多种类型的DRM保护
- 📊 **多种输出格式**: 支持文本、JSON、CSV格式的报告
- 🌍 **跨平台**: 支持Windows、macOS、Linux
- 📈 **进度显示**: 实时显示扫描进度

## DRM检测原理

该工具通过以下方式检测EPUB文件是否被DRM保护：

1. **ZIP结构验证**: 检查文件是否为有效的ZIP格式
2. **加密文件检测**: 查找`META-INF/encryption.xml`等DRM相关文件
3. **容器文件验证**: 检查`META-INF/container.xml`的完整性
4. **OPF文件分析**: 验证内容包文件是否可读
5. **可疑文件模式**: 检测已知的DRM文件模式

## 安装

### 前提条件

- Node.js 14.0.0 或更高版本

### 安装步骤

1. 克隆或下载项目：
```bash
git clone <repository-url>
cd epub-drm-check
```

2. 安装依赖：
```bash
npm install
```

3. （可选）全局安装：
```bash
npm install -g .
```

## 使用方法

### 基本用法

```bash
# 扫描指定目录
node src/index.js /path/to/epub/directory

# 如果全局安装了
epub-drm-check /path/to/epub/directory
```

### 高级选项

```bash
# 递归扫描子目录（默认启用）
epub-drm-check /path/to/directory --recursive

# 设置并发数量（默认10）
epub-drm-check /path/to/directory --concurrency 5

# 生成JSON报告
epub-drm-check /path/to/directory --output report.json --format json

# 生成CSV报告
epub-drm-check /path/to/directory --output report.csv --format csv

# 详细输出模式
epub-drm-check /path/to/directory --verbose
```

### 完整参数说明

```
Usage: epub-drm-check [options] <directory>

Options:
  -V, --version              显示版本号
  -r, --recursive            递归扫描子目录 (默认: true)
  -o, --output <file>        将报告保存到文件
  -f, --format <type>        输出格式 (json|csv|txt) (默认: "txt")
  -c, --concurrency <number> 并发文件检查数量 (默认: "10")
  -v, --verbose              详细输出模式
  -h, --help                 显示帮助信息
```

## 输出示例

### 控制台输出

```
🔍 Scanning directory: /Users/example/Books
📚 Found 150 EPUB files
Checking DRM |████████████████████| 100% | 150/150

📊 Scan Results:

🔒 DRM-Protected Files:
  1. Protected_Book.epub
     Path: /Users/example/Books/Protected_Book.epub
     Size: 2.5 MB
     DRM Type: Adobe DRM (encryption.xml found)

✅ Readable Files: 148

📊 Summary:
  Total EPUB files: 150
  DRM-protected: 2
  Readable: 148
  Errors: 0
```

### JSON报告格式

```json
{
  "scanDate": "2025-07-15T10:30:00.000Z",
  "summary": {
    "totalFiles": 150,
    "drmProtected": 2,
    "readable": 148,
    "errors": 0
  },
  "files": [
    {
      "fileName": "example.epub",
      "filePath": "/path/to/example.epub",
      "fileSize": 2621440,
      "fileSizeFormatted": "2.5 MB",
      "isDRMProtected": false,
      "drmType": null,
      "details": {},
      "error": null,
      "checkTime": "2025-07-15T10:30:01.000Z"
    }
  ]
}
```

## 性能优化

- **并发控制**: 默认并发数量为10，可根据系统性能调整
- **内存效率**: 只读取必要的文件头和关键文件，不完全解压
- **错误处理**: 遇到损坏文件时继续处理其他文件
- **进度显示**: 实时显示处理进度，便于监控长时间运行的任务

## 支持的DRM类型

- Adobe DRM (ADEPT)
- Amazon Kindle DRM
- 自定义加密方案
- 损坏或无效的ZIP结构
- 缺失关键EPUB文件

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
