import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static('public'));

// 模拟的 skills 数据存储
let skills = [
  {
    id: '1',
    name: 'frontend-design',
    url: 'https://skills.sh/anthropics/skills/frontend-design',
    status: 'active',
    version: '1.0.0',
    lastUsed: new Date().toISOString(),
    usageCount: 42,
    description: '前端设计和UI开发辅助工具'
  },
  {
    id: '2',
    name: 'seeddance-video',
    url: 'local',
    status: 'active',
    version: '1.0.0',
    lastUsed: new Date().toISOString(),
    usageCount: 15,
    description: '视频生成工具，基于豆包SeedDance模型'
  }
];

let taskLogs = [];

// WebSocket 连接处理
wss.on('connection', (ws) => {
  console.log('客户端已连接');

  ws.on('message', (message) => {
    console.log('收到消息:', message.toString());
  });

  ws.on('close', () => {
    console.log('客户端已断开');
  });
});

// 广播消息给所有连接的客户端
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// API 路由

// 获取所有 skills
app.get('/api/skills', (req, res) => {
  res.json(skills);
});

// 获取单个 skill
app.get('/api/skills/:id', (req, res) => {
  const skill = skills.find(s => s.id === req.params.id);
  if (skill) {
    res.json(skill);
  } else {
    res.status(404).json({ error: 'Skill not found' });
  }
});

// 添加新 skill
app.post('/api/skills', (req, res) => {
  const newSkill = {
    id: Date.now().toString(),
    name: req.body.name,
    url: req.body.url,
    status: 'active',
    version: req.body.version || '1.0.0',
    lastUsed: new Date().toISOString(),
    usageCount: 0,
    description: req.body.description || ''
  };

  skills.push(newSkill);
  broadcast({ type: 'skill_added', skill: newSkill });
  res.status(201).json(newSkill);
});

// 更新 skill
app.put('/api/skills/:id', (req, res) => {
  const index = skills.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    skills[index] = { ...skills[index], ...req.body };
    broadcast({ type: 'skill_updated', skill: skills[index] });
    res.json(skills[index]);
  } else {
    res.status(404).json({ error: 'Skill not found' });
  }
});

// 删除 skill
app.delete('/api/skills/:id', (req, res) => {
  const index = skills.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    const deleted = skills.splice(index, 1)[0];
    broadcast({ type: 'skill_deleted', skillId: req.params.id });
    res.json({ message: 'Skill deleted', skill: deleted });
  } else {
    res.status(404).json({ error: 'Skill not found' });
  }
});

// 获取任务日志
app.get('/api/logs', (req, res) => {
  res.json(taskLogs);
});

// 添加任务日志
app.post('/api/logs', (req, res) => {
  const log = {
    id: Date.now().toString(),
    skillId: req.body.skillId,
    skillName: req.body.skillName,
    action: req.body.action,
    status: req.body.status,
    message: req.body.message,
    timestamp: new Date().toISOString()
  };

  taskLogs.unshift(log);
  if (taskLogs.length > 100) taskLogs.pop();

  broadcast({ type: 'log_added', log });
  res.status(201).json(log);
});

// 获取统计数据
app.get('/api/stats', (req, res) => {
  const stats = {
    totalSkills: skills.length,
    activeSkills: skills.filter(s => s.status === 'active').length,
    totalUsage: skills.reduce((sum, s) => sum + s.usageCount, 0),
    recentLogs: taskLogs.length
  };
  res.json(stats);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Skills 管理平台运行在 http://localhost:${PORT}`);
});
