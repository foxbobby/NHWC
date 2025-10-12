# FoxAI 你画我猜

一个基于 AI 的在线绘画猜测游戏，使用 Next.js 构建，集成硅基流动 API 进行图像识别。

## 🎮 游戏特色

- 🎨 **自由绘画**: 支持鼠标、触控和Apple Pencil的流畅绘图体验
- 🤖 **AI 识别**: 使用先进的视觉语言模型识别绘画内容
- 📱 **多屏幕适配**: 完美适配iPad、手机、平板和桌面端
- 🍎 **iPad专用优化**: 针对iPad横竖屏的专门布局和交互优化
- 🦊 **FoxAI 品牌**: 一致的品牌视觉设计和毛玻璃效果
- 📊 **统计追踪**: 详细的游戏统计和历史记录
- ⚡ **高性能**: 60fps绘图、GPU加速和离屏渲染优化
- 💡 **智能提示**: 实时绘画指导和技巧提示
- 💾 **进度保存**: 自动保存和离线模式支持

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd foxai-draw-guess
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   ```
   
   编辑 `.env.local` 文件，添加你的硅基流动 API 密钥：
   ```env
   SILICONFLOW_API_KEY=your_api_key_here
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

5. **访问应用**
   
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)
   
   > 💡 **iPad用户**: 建议使用Safari浏览器以获得最佳体验，支持Apple Pencil和多点触控

## 🍎 iPad 专用优化

本项目针对iPad进行了深度优化，提供最佳的绘画和游戏体验：

### 🎨 绘画体验
- **Apple Pencil支持**: 完整的压感和倾斜检测
- **60fps流畅绘制**: 硬件加速渲染
- **智能手势识别**: 区分绘画和导航操作
- **高精度画布**: 支持Retina显示屏

### 📱 界面适配
- **横屏布局**: 左右分栏，画布居中，工具栏在侧
- **竖屏布局**: 上下分布，优化单手操作
- **自动旋转**: 设备旋转时智能切换布局
- **触控优化**: 44px最小触控目标，符合Apple设计规范

### ⚡ 性能优化
- **离屏渲染**: 减少主线程阻塞
- **GPU加速**: 硬件加速图形处理
- **内存管理**: 智能缓存和资源清理
- **电池优化**: 降低功耗，延长使用时间

> 📖 详细的iPad优化说明请查看 [iPad优化指南](./IPAD_OPTIMIZATION_GUIDE.md)

## 🛠️ 技术栈

- **前端框架**: Next.js 15 (App Router)
- **开发语言**: TypeScript
- **样式框架**: Tailwind CSS v4 + iPad专用优化
- **UI 组件**: 自定义组件库 + 多屏幕适配
- **状态管理**: React Context + useReducer
- **绘图引擎**: HTML5 Canvas + 高性能渲染
- **AI 服务**: 硅基流动 API (Qwen2-VL-72B-Instruct)
- **部署平台**: Vercel

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── Common/           # 通用组件
│   ├── DrawingCanvas/    # 绘图相关组件
│   ├── GameUI/           # 游戏界面组件
│   └── Layout/           # 布局组件
├── hooks/                # 自定义 Hooks
├── services/             # 服务层
├── types/                # TypeScript 类型定义
└── lib/                  # 工具函数和常量
```

## 🎯 核心功能

### 绘图系统
- 支持多种输入设备（鼠标、触控、手写笔）
- 可调节画笔大小和颜色
- 撤销/重做功能
- 响应式画布尺寸

### AI 识别
- 集成硅基流动视觉语言模型
- 智能图像内容识别
- 多候选结果展示
- 置信度评分

### 游戏机制
- 多回合游戏模式
- 实时计分系统
- 时间限制挑战
- 难度等级评估

### 数据持久化
- 本地存储游戏历史
- 玩家统计追踪
- 偏好设置保存
- 数据导入/导出

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 包分析（需要设置 ANALYZE=true）
npm run analyze
```

## 🚀 部署到 Vercel

1. **推送代码到 Git 仓库**

2. **连接 Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 导入你的 Git 仓库

3. **配置环境变量**
   - 在 Vercel 项目设置中添加环境变量
   - 设置 `SILICONFLOW_API_KEY`

4. **部署**
   - Vercel 会自动构建和部署
   - 每次推送到主分支都会触发自动部署

## 🎨 自定义配置

### 品牌色彩
在 `src/lib/constants.ts` 中修改品牌色彩：

```typescript
export const BRAND_COLORS = {
  primary: '#2563EB',    // 主色
  secondary: '#F97316',  // 辅助色
  neutral: '#64748B',    // 中性色
  // ...
};
```

### 游戏设置
在 `src/lib/constants.ts` 中调整游戏配置：

```typescript
export const GAME_CONFIG = {
  DEFAULT_ROUNDS: 5,        // 默认回合数
  ROUND_TIME_LIMIT: 60,     // 回合时间限制（秒）
  MAX_GUESS_RESULTS: 5,     // 最大猜测结果数
  // ...
};
```

## 🐛 故障排除

### 常见问题

1. **API 调用失败**
   - 检查 `SILICONFLOW_API_KEY` 是否正确设置
   - 确认 API 密钥有效且有足够额度

2. **画布不显示**
   - 检查浏览器是否支持 HTML5 Canvas
   - 确认没有 JavaScript 错误

3. **移动端触控问题**
   - 检查是否启用了触控事件处理
   - 确认 CSS 触控样式正确应用

### 调试模式

设置环境变量启用调试：
```env
NODE_ENV=development
```

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件到 support@foxai.com

---

**FoxAI 你画我猜** - 让 AI 猜猜你的创意！ 🎨🤖