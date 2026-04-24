# 🎨 电商配图助手

> 上传产品图，一键生成绝美国风宣传海报！无需专业设计师，瞬间拉满商品视觉高级感，零门槛搞定爆款配图！

基于 [Dify](https://dify.ai) Chatflow 的 AI 电商配图生成工具，前端 + Node.js 后端架构，API Key 安全存储在服务端。

## ✨ 功能特性

- 🖼️ **多种图片输入** — 支持点击上传、拖拽文件、Ctrl/Cmd+V 粘贴截图
- 📝 **自然语言描述** — 输入文字需求，AI 自动理解并生成配图
- 📋 **任务队列** — 支持连续提交多个生成任务，自动排队依次执行
- 👁️ **实时预览** — 点击队列中的任务即可查看生成状态和结果
- 🔄 **一键重试** — 对不满意的结果可直接重新生成
- 💾 **图片下载** — 生成完成后一键保存到本地
- 🎯 **三栏布局** — 左侧输入 / 中间队列 / 右侧预览，清晰高效
- 🔒 **API Key 安全** — Key 仅存在于服务端，前端代码零泄露

## 🏗️ 架构

```
浏览器 → Node.js 后端 (/api/upload, /api/chat) → Dify API
                ↓
        API Key 安全存储在服务端 .env 中
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 填入你的 Dify 配置：

```env
API_BASE_URL=https://your-dify-server.com/v1   # Dify API 地址
API_KEY=app-your-api-key-here                    # Dify 应用密钥
PORT=3088                                        # 后端端口
```

### 3. 开发模式

```bash
# 终端 1: 启动后端
npm start

# 终端 2: 启动前端开发服务器
npm run dev
```

前端访问 `http://localhost:5180/`，`/api` 请求自动代理到后端。

### 4. 生产部署

```bash
npm run build    # 打包前端到 dist/
npm start        # 启动后端（同时托管静态文件）
```

访问 `http://localhost:3088` 即可。

## 📁 项目结构

```
├── server.js          # Node.js 后端（API 代理 + 静态托管）
├── main.js            # 前端逻辑
├── index.html         # 页面结构
├── style.css          # 样式
├── vite.config.js     # Vite 配置（开发代理）
├── .env               # 环境变量（不提交）
├── .env.example       # 环境变量模板
└── dist/              # 打包产物（不提交）
```

## 🛡️ 安全说明

- API Key **不会**出现在前端代码、打包产物或 Git 历史中
- 所有 Dify API 调用通过 Node.js 后端代理，Key 仅存在于服务端 `.env` 文件
- `.env` 已加入 `.gitignore`，不会被提交到仓库

## 🔧 技术栈

- **Express** — 后端代理服务
- **Vite** — 前端构建工具
- **原生 HTML / CSS / JS** — 零框架依赖，极致轻量
- **Dify API** — AI 图像生成
- **Google Material Icons** — 图标库
- **Inter 字体** — 现代 UI 排版

## 📦 服务器部署

详见 [部署说明.md](./部署说明.md)，支持 Nginx 反向代理 + PM2 进程管理。

## 📄 License

MIT
