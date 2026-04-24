# 🎨 电商配图助手

> 上传产品图，一键生成绝美国风宣传海报！无需专业设计师，瞬间拉满商品视觉高级感，零门槛搞定爆款配图！

基于 [Dify](https://dify.ai) Chatflow 的 AI 电商配图生成工具，纯前端实现，轻量高效。

## ✨ 功能特性

- 🖼️ **多种图片输入** — 支持点击上传、拖拽文件、Ctrl/Cmd+V 粘贴截图
- 📝 **自然语言描述** — 输入文字需求，AI 自动理解并生成配图
- 📋 **任务队列** — 支持连续提交多个生成任务，自动排队依次执行
- 👁️ **实时预览** — 点击队列中的任务即可查看生成状态和结果
- 🔄 **一键重试** — 对不满意的结果可直接重新生成
- 💾 **图片下载** — 生成完成后一键保存到本地
- 🎯 **三栏布局** — 左侧输入 / 中间队列 / 右侧预览，清晰高效

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5180/`

### 生产打包

```bash
npm run build
```

打包产物在 `dist/` 目录，可部署到任意静态服务器。

## ⚙️ 配置

复制 `.env.example` 为 `.env`，填入你的 Dify 配置：

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=https://your-dify-server.com/v1   # Dify API 地址
VITE_API_KEY=app-your-api-key-here                    # Dify 应用密钥
```

## 🏗️ 技术栈

- **Vite** — 构建工具
- **原生 HTML / CSS / JS** — 零框架依赖，极致轻量
- **Dify API** — AI 图像生成后端
- **Google Material Icons** — 图标库
- **Inter 字体** — 现代 UI 排版

## 📦 部署

详见 [部署说明.md](./部署说明.md)，支持 Nginx / IIS / 本地静态服务器等多种方式。

## 📄 License

MIT
