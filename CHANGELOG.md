# 更新日志 (CHANGELOG)

## v1.2.1 - 2025-07-16

### 🐛 **Bug Fixes**
- **False Positive Fix**: Fixed MOBI/AZW3 DRM detection false positives that incorrectly flagged legitimate eBooks as DRM-protected
- **EXTH Record Analysis**: Improved EXTH record content analysis to distinguish between actual DRM data and normal metadata
- **Null Byte Handling**: Added detection for null-byte padding in DRM fields to avoid false positives
- **Empty Field Filtering**: Enhanced filtering of empty or placeholder DRM record fields

### 🔍 **Detection Improvements**
- **Content-Based Validation**: Now validates EXTH record content, not just record type presence
- **Padding Detection**: Skips records filled with null bytes or control characters
- **Threshold Validation**: Improved validation thresholds for DRM field content length
- **Amazon DRM Accuracy**: More accurate detection of actual Amazon DRM vs normal Kindle metadata

### ⚡ **Validation**
- **Real Book Testing**: Verified with actual MOBI/AZW3 files to ensure no false positives
- **Test Suite**: All existing tests continue to pass
- **Regression Prevention**: Added logic to prevent similar false positives in the future

---

## v1.2.0 - 2025-07-16

### 🧪 **测试与质量保证**
- **全面的测试套件**: 新增基于Jest的测试，包含34个测试用例
- **测试覆盖率**: 所有模块的代码覆盖率超过80%
- **自动化测试**: 为持续集成添加测试脚本
- **单元测试**: 检测器、扫描器、报告器和工具的完整测试覆盖

### 🚀 **性能与基准测试**
- **基准测试工具**: 添加`npm run benchmark`以测试最佳并发设置
- **性能指标**: 内存使用情况跟踪和时间分析
- **优化数据**: 自动检测最佳性能设置
- **并发处理**: 验证不同系统配置的最佳并发级别

### 📚 **示例与文档**
- **交互式示例**: 添加`npm run examples`，展示真实世界的使用案例
- **用法示例**: 所有支持格式和选项的完整示例
- **最佳实践**: 文档记录最佳使用模式
- **输出示例**: JSON、CSV和TXT输出的真实示例

### 🛠️ **开发者体验**
- **npm脚本**: 添加全面的脚本集合（测试、基准、示例）
- **测试命令**: 多种测试模式（观察、覆盖、单次运行）
- **开发工具**: 通过适当的工具增强开发工作流
- **代码质量**: 改进错误处理和边缘情况管理

### 📖 **文档改进**
- **完整的README重写**: 提供全面的英文文档
- **架构概述**: 清晰解释模块化设计
- **故障排除指南**: 常见问题及解决方案
- **贡献指南**: 为贡献者提供清晰的说明

### 🔧 **小幅改进**
- **版本更新**: 所有文件更新至v1.2.0
- **清晰的输出格式**: 修复控制台输出中的小格式问题
- **更好的错误信息**: 提供更具描述性的错误处理
- **跨平台兼容性**: 增强Windows路径处理

### 🏗️ **基础设施**
- **Jest配置**: 正确的测试环境设置
- **覆盖率报告**: 提供HTML和LCOV覆盖率报告
- **GitHub准备**: 改进.gitignore和项目结构
- **包管理**: 清理依赖管理

---

## v1.1.0 - 2025-07-16

### 🎉 重大新功能
- **多格式支持**: 新增对MOBI、AZW3、AZW格式的支持
- **Amazon DRM检测**: 实现Kindle电子书DRM保护检测
- **高级MOBI解析**: 支持PalmDOC头部、MOBI头部、EXTH记录解析

### ✨ 功能增强
- **文件格式自动识别**: 根据文件扩展名和魔数自动检测格式
- **DRM类型细分**: 区分Adobe DRM和Amazon DRM不同类型
- **更详细的检测信息**: 输出DRM偏移量、标志位等技术细节
- **增强的错误处理**: 更好的格式验证和错误报告

### 🛠️ 技术改进
- **模块化检测器**: 分离EPUB和MOBI/AZW检测逻辑
- **性能优化**: 只读取文件头部信息，避免加载完整文件
- **内存效率**: 优化大文件处理的内存使用
- **跨平台兼容**: 改进的二进制数据处理

### 📊 检测能力
#### 新增Amazon DRM检测
- DRM偏移量检测
- DRM标志位分析
- EXTH记录中的DRM信息
- PID加密识别

#### 增强的EPUB检测
- 保持原有的Adobe DRM检测功能
- 改进的ZIP结构验证
- 更准确的加密文件识别

### 🔧 API变化
- `fileType` 字段添加到检测结果中
- `details.fileFormat` 提供准确的格式信息
- DRM详细信息包含格式特定的技术参数

### 📈 性能提升
- **并发处理**: 保持原有的高效并发架构
- **文件头读取**: 智能读取，只加载必要的字节数
- **格式检测缓存**: 避免重复的文件格式检测

### 🐛 Bug修复
- 修复ZIP文件过早关闭的问题
- 改进错误处理和异常捕获
- 解决大文件处理的内存泄漏

### 📚 文档更新
- 更新README包含所有支持格式
- 添加MOBI/AZW检测原理说明
- 新增多格式使用示例
- 更新性能基准测试

---

## v1.0.0 - 2025-07-15

### 🎉 初始版本
- **EPUB DRM检测**: 基础的EPUB文件DRM保护检测
- **Adobe DRM支持**: 检测encryption.xml和rights.xml
- **批量扫描**: 支持目录递归扫描
- **多格式报告**: JSON、CSV、TXT格式输出
- **并发处理**: 可配置的并发文件检查
- **跨平台支持**: Windows、macOS、Linux支持
- **进度显示**: 实时进度条和彩色输出
- **性能优化**: 高效的ZIP文件处理

### 📦 核心功能
- CLI命令行界面
- 递归目录扫描
- 并发文件处理
- 多种输出格式
- 详细的DRM分析报告

### 🔒 DRM检测
- Adobe DRM (ADEPT)
- ZIP结构验证
- 容器文件检查
- OPF文件分析
- 可疑文件模式识别

---

## 技术栈
- **Node.js**: 14.0.0+
- **核心依赖**:
  - adm-zip: ZIP文件处理
  - commander: CLI参数解析
  - chalk: 彩色终端输出
  - cli-progress: 进度条显示
  - p-limit: 并发控制

## 贡献者
- 感谢所有贡献者的努力和支持

## 许可证
MIT License
