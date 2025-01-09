# 沙锅导图

一个基于React的智能思维导图应用,支持自然对话式创建和编辑思维导图,集成AI助手实现智能问答。

## 主要特性

- 🤖 AI智能问答
- 📝 自然对话式编辑
- 🎯 直观的思维导图展示
- 🖱️ 支持缩放和拖拽
- ✨ 流畅的动画效果
- 📱 响应式布局

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.14.0

### 安装
npm install

### 运行
启动后端服务:
npm run server:dev

启动前端开发服务器:
npm start

### 开发环境配置(可选)
1. 复制 `.env.example` 为 `.env`
2. 配置必要的环境变量:
REACT_APP_API_URL=http://localhost:3001
ARK_API_KEY=your_api_key
API_BASE_URL=your_base_url

## 项目结构
src/
├── components/ # 通用组件
├── features/ # 功能模块
│ ├── ai/ # AI 相关功能
│ ├── canvas/ # 画布功能
│ ├── nodes/ # 节点功能
│ └── layout/ # 布局功能
├── services/ # API 服务
├── hooks/ # 自定义 Hooks
└── shared/ # 共享工具和配置

## 技术栈
- React 18
- TypeScript
- D3.js - 布局算法
- Express - 后端服务
- OpenAI API - AI能力支持

## 使用说明

1. 创建节点
- 按 Tab 键创建新的问题节点
- 双击节点编辑内容

2. 操作画布
- 鼠标拖拽移动画布
- 滚轮缩放画布
- 点击节点选中

3. AI 问答
- 编辑问题节点触发 AI 回答
- 支持流式响应显示

## 开发指南

### 代码规范
- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循 TypeScript 类型定义
- 组件采用函数式编程
