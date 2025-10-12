# FoxAI 你画我猜 - 部署指南

## 🚀 Vercel 部署步骤

### 1. 准备工作

确保你有以下准备：
- GitHub 账号
- Vercel 账号
- 硅基流动 API 密钥

### 2. 推送代码到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: FoxAI Draw and Guess Game"

# 添加远程仓库
git remote add origin https://github.com/your-username/foxai-draw-guess.git

# 推送到 GitHub
git push -u origin main
```

### 3. 在 Vercel 上部署

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```
   SILICONFLOW_API_KEY=你的硅基流动API密钥
   ```

4. **部署设置**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **点击 Deploy**
   - Vercel 会自动构建和部署你的应用
   - 部署完成后会提供一个 URL

### 4. 验证部署

部署完成后，访问提供的 URL 并测试：

1. **基本功能测试**
   - [ ] 页面正常加载
   - [ ] FoxAI 品牌显示正确
   - [ ] 响应式布局在不同设备上正常

2. **绘画功能测试**
   - [ ] 画布可以正常绘制
   - [ ] 画笔颜色和大小可以调整
   - [ ] 撤销/重做功能正常

3. **AI 功能测试**
   - [ ] 可以提交绘画
   - [ ] AI 返回猜测结果
   - [ ] 错误处理正常

4. **游戏流程测试**
   - [ ] 可以开始游戏
   - [ ] 回合切换正常
   - [ ] 分数统计正确

## 🔧 自定义域名（可选）

如果你有自己的域名：

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名
3. 按照提示配置 DNS 记录

## 📊 监控和分析

### 性能监控
- Vercel 提供内置的性能分析
- 查看 "Analytics" 标签页了解访问情况

### 错误监控
- 查看 "Functions" 标签页监控 API 调用
- 检查日志了解错误情况

## 🔄 持续部署

配置完成后，每次推送到 main 分支都会自动触发部署：

```bash
# 修改代码后
git add .
git commit -m "Update: 描述你的更改"
git push origin main
```

## 🛠️ 故障排除

### 常见问题

1. **构建失败**
   - 检查 TypeScript 错误
   - 确认所有依赖都已安装
   - 查看构建日志了解具体错误

2. **API 调用失败**
   - 确认环境变量设置正确
   - 检查 API 密钥是否有效
   - 查看函数日志了解错误详情

3. **性能问题**
   - 检查图像压缩设置
   - 优化 API 调用频率
   - 考虑添加缓存策略

### 调试步骤

1. **查看 Vercel 日志**
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel

   # 登录
   vercel login

   # 查看日志
   vercel logs
   ```

2. **本地测试**
   ```bash
   # 本地开发
   npm run dev

   # 本地构建测试
   npm run build
   npm run start
   ```

## 📈 优化建议

### 性能优化
- 启用 Vercel 的 Edge Functions（如需要）
- 配置适当的缓存策略
- 优化图像大小和质量

### 用户体验优化
- 添加 PWA 支持
- 实现离线功能
- 添加更多游戏模式

### 监控优化
- 集成错误监控服务（如 Sentry）
- 添加用户行为分析
- 设置性能警报

## 🔐 安全考虑

- API 密钥仅在服务端使用
- 实施适当的速率限制
- 验证所有用户输入
- 使用 HTTPS（Vercel 自动提供）

## 📞 支持

如果遇到问题：
1. 查看 Vercel 文档
2. 检查项目的 GitHub Issues
3. 联系技术支持

---

**部署成功！** 🎉

你的 FoxAI 你画我猜游戏现在已经在线运行了！