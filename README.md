# Skills 管理监控平台

一个现代化的 Web 应用，用于管理和监控 Claude Code Skills。

## 功能特性

- 📊 实时统计仪表板
- 🛠️ Skills 管理（添加、编辑、删除、启用/停用）
- 📝 实时日志监控
- 🔄 WebSocket 实时更新
- 💫 现代化 UI 设计

## 快速开始

### 安装依赖

```bash
cd skills-platform
npm install
```

### 启动服务

```bash
npm run dev
```

服务将在 http://localhost:3000 启动

## 使用说明

### 添加 Skill

1. 点击"添加 Skill"按钮
2. 填写 Skill 信息：
   - 名称：Skill 的名称
   - URL：Skill 的来源 URL
   - 版本：版本号
   - 描述：简短描述

### 管理 Skill

- **启用/停用**：切换 Skill 的活跃状态
- **删除**：永久删除 Skill
- **查看详情**：查看使用次数、最后使用时间等信息

### 监控日志

实时查看所有 Skill 的操作日志，包括：
- 添加/删除操作
- 状态变更
- 使用记录

## API 接口

### Skills

- `GET /api/skills` - 获取所有 skills
- `GET /api/skills/:id` - 获取单个 skill
- `POST /api/skills` - 添加新 skill
- `PUT /api/skills/:id` - 更新 skill
- `DELETE /api/skills/:id` - 删除 skill

### 日志

- `GET /api/logs` - 获取日志列表
- `POST /api/logs` - 添加日志

### 统计

- `GET /api/stats` - 获取统计数据

## 技术栈

- **后端**: Node.js + Express + WebSocket
- **前端**: 原生 JavaScript + CSS3
- **实时通信**: WebSocket

## 项目结构

```
skills-platform/
├── server.js           # 后端服务器
├── package.json        # 项目配置
└── public/            # 前端文件
    ├── index.html     # 主页面
    ├── styles.css     # 样式文件
    └── app.js         # 前端逻辑
```

## 注意事项

- 确保端口 3000 未被占用
- 数据存储在内存中，重启服务后会丢失
- 生产环境建议使用数据库存储

## 后续扩展

- [ ] 数据库持久化
- [ ] 用户认证
- [ ] Skill 执行监控
- [ ] 性能分析
- [ ] 导出报告
