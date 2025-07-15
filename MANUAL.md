# EPUB DRM 检测工具用户手册

## 快速开始

### 安装
```bash
npm install
```

### 基本使用
```bash
# 扫描目录中的EPUB文件
node src/index.js /path/to/epub/directory

# 或使用npm脚本
npm start /path/to/epub/directory
```

## 命令行选项

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `-r, --recursive` | 递归扫描子目录 | true |
| `-o, --output <file>` | 输出报告到文件 | - |
| `-f, --format <type>` | 输出格式 (json\|csv\|txt) | txt |
| `-c, --concurrency <number>` | 并发检查数量 | 10 |
| `-v, --verbose` | 详细输出模式 | false |

## 使用示例

### 1. 基本扫描
```bash
node src/index.js ~/Books
```

### 2. 生成详细JSON报告
```bash
node src/index.js ~/Books --output report.json --format json --verbose
```

### 3. 批量处理大型库
```bash
node src/index.js ~/LargeBookLibrary --concurrency 20 --output library-scan.csv --format csv
```

### 4. 扫描网络驱动器（降低并发）
```bash
node src/index.js "\\network\books" --concurrency 3 --verbose
```

## 性能调优

### 并发设置建议
- **本地SSD**: 10-20并发
- **本地HDD**: 5-10并发
- **网络驱动器**: 1-5并发
- **低内存系统**: 5并发以下

### 内存使用
- 每个并发任务约占用1-2MB内存
- 建议预留至少500MB可用内存
- 大文件会消耗更多内存

## DRM检测类型

本工具可检测以下DRM保护类型：

1. **Adobe DRM (ADEPT)**
   - 检测 `META-INF/encryption.xml`
   - 检测 `META-INF/rights.xml`

2. **无效ZIP结构**
   - 文件头损坏
   - ZIP签名无效

3. **缺失关键文件**
   - 缺失 `META-INF/container.xml`
   - 缺失 OPF 文件

4. **可疑文件模式**
   - `.acsm` 文件
   - DRM相关文件名

## 输出格式

### 控制台输出
- 实时进度条
- 彩色状态显示
- 汇总统计信息

### JSON格式
```json
{
  "scanDate": "2025-07-15T13:41:00.117Z",
  "summary": {
    "totalFiles": 100,
    "drmProtected": 15,
    "readable": 85,
    "errors": 0
  },
  "files": [...]
}
```

### CSV格式
适合Excel分析，包含以下列：
- File Name
- File Path
- File Size (Bytes)
- File Size (Formatted)
- DRM Protected
- DRM Type
- Error
- Check Time

## 故障排除

### 常见问题

**Q: 扫描速度慢**
A: 尝试调整并发数量，或检查磁盘IO性能

**Q: 内存不足错误**
A: 降低并发数量到5以下

**Q: 权限错误**
A: 确保对目标目录有读取权限

**Q: 误报DRM保护**
A: 某些损坏的EPUB文件可能被误识别为DRM保护

### 调试模式
使用 `--verbose` 获取详细错误信息：
```bash
node src/index.js /path --verbose
```

## 脚本使用

### 运行示例
```bash
npm run examples
```

### 性能基准测试
```bash
npm run benchmark
```

## 系统要求

- **Node.js**: 14.0.0+
- **内存**: 最少512MB
- **磁盘**: 取决于扫描文件数量
- **操作系统**: Windows/macOS/Linux

## 技术限制

1. 只能检测已知的DRM格式
2. 无法检测自定义加密方案
3. 损坏文件可能被误报为DRM保护
4. 大型文件（>100MB）处理较慢

## 许可证

MIT License - 详见LICENSE文件
