# 🧪 测试指南

## ⚠️ 重要提醒

**请不要直接双击打开HTML文件！** 这会导致文件协议访问和CORS错误。

## 🚀 正确的测试方法

### **1. 启动服务器**
```bash
cd D:\python_project\openmanus-test
python server.py
```

等待看到类似输出：
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### **2. 通过浏览器访问**

**主要测试页面**：
- 🏠 **主页面**: http://localhost:8000/
- 🧪 **静态文件测试**: http://localhost:8000/test-static-files
- 🖼️ **Logo测试**: http://localhost:8000/test-task-logo

**直接访问静态资源**：
- 📄 **Logo图片**: http://localhost:8000/assets/logo.jpg
- 🎨 **CSS文件**: http://localhost:8000/static/manus-main.css
- ⚙️ **JS文件**: http://localhost:8000/static/manus-main.js

## 🔍 问题诊断

### **如果仍然出现404错误**：

1. **检查服务器是否正常启动**
   ```bash
   python server.py
   ```

2. **检查端口是否正确**
   - 服务器默认运行在 `http://localhost:8000`
   - 如果端口不同，请使用正确的端口

3. **检查文件是否存在**
   ```bash
   ls -la assets/logo.jpg
   ls -la static/manus-main.css
   ```

### **如果出现CORS错误**：

1. **确认通过HTTP访问，不是file://协议**
2. **检查URL是否正确**：
   - ✅ 正确：`http://localhost:8000/test-static-files`
   - ❌ 错误：`file:///D:/python_project/openmanus-test/test_static_files.html`

## 🧪 测试步骤

### **步骤1：基础静态文件测试**
```
http://localhost:8000/test-static-files
```
- 应该看到所有文件状态为"✅ 加载成功"
- 不应该有任何404或CORS错误

### **步骤2：Logo专项测试**
```
http://localhost:8000/test-task-logo
```
- 测试动态创建的Manus消息logo
- 测试备用方案效果

### **步骤3：主应用测试**
```
http://localhost:8000/
```
- 输入任务，进入任务执行页面
- 查看Manus消息头像是否正常显示

## 📊 预期结果

### **静态文件测试页面应显示**：
- ✅ Logo图片加载：200 OK
- ✅ 社区图片加载：200 OK
- ✅ CSS文件：200 OK
- ✅ JS文件：200 OK

### **浏览器控制台应该**：
- ✅ 无404错误
- ✅ 无CORS错误
- ✅ 显示"Logo加载成功"等日志

### **任务页面应显示**：
- ✅ Manus消息头像正常显示logo
- ✅ 或显示蓝紫色渐变备用方案

## 🆘 如果问题仍然存在

请提供以下信息：

1. **服务器启动日志**
2. **浏览器访问的完整URL**
3. **浏览器控制台的完整错误信息**
4. **访问 http://localhost:8000/assets/logo.jpg 的结果**

## 💡 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `file:/// ERR_FILE_NOT_FOUND` | 直接打开HTML文件 | 通过HTTP服务器访问 |
| `CORS policy` | 跨域访问限制 | 确保同源访问 |
| `404 Not Found` | 静态文件路由未配置 | 检查服务器配置 |
| `Connection refused` | 服务器未启动 | 运行 `python server.py` |
