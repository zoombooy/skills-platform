let ws;
let skills = [];
let logs = [];

// WebSocket 连接
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    updateConnectionStatus(true);
    console.log('WebSocket 已连接');
  };

  ws.onclose = () => {
    updateConnectionStatus(false);
    console.log('WebSocket 已断开，5秒后重连...');
    setTimeout(connectWebSocket, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
}

function updateConnectionStatus(connected) {
  const statusDot = document.getElementById('ws-status');
  const statusText = document.getElementById('ws-text');

  if (connected) {
    statusDot.className = 'status-dot connected';
    statusText.textContent = '已连接';
  } else {
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = '未连接';
  }
}

function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'skill_added':
      skills.push(data.skill);
      renderSkills();
      loadStats();
      break;
    case 'skill_updated':
      const index = skills.findIndex(s => s.id === data.skill.id);
      if (index !== -1) {
        skills[index] = data.skill;
        renderSkills();
      }
      break;
    case 'skill_deleted':
      skills = skills.filter(s => s.id !== data.skillId);
      renderSkills();
      loadStats();
      break;
    case 'log_added':
      logs.unshift(data.log);
      if (logs.length > 50) logs.pop();
      renderLogs();
      loadStats();
      break;
  }
}

// 加载数据
async function loadSkills() {
  try {
    const response = await fetch('/api/skills');
    skills = await response.json();
    renderSkills();
  } catch (error) {
    console.error('加载 skills 失败:', error);
  }
}

async function loadLogs() {
  try {
    const response = await fetch('/api/logs');
    logs = await response.json();
    renderLogs();
  } catch (error) {
    console.error('加载日志失败:', error);
  }
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();

    document.getElementById('total-skills').textContent = stats.totalSkills;
    document.getElementById('active-skills').textContent = stats.activeSkills;
    document.getElementById('total-usage').textContent = stats.totalUsage;
    document.getElementById('recent-logs').textContent = stats.recentLogs;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 渲染 Skills
function renderSkills() {
  const container = document.getElementById('skills-list');

  if (skills.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #888;">暂无 Skills</p>';
    return;
  }

  container.innerHTML = skills.map(skill => `
    <div class="skill-card">
      <div class="skill-header">
        <div>
          <div class="skill-title">${skill.name}</div>
          <div class="skill-url">${skill.url}</div>
        </div>
        <span class="skill-status ${skill.status}">${skill.status === 'active' ? '活跃' : '未激活'}</span>
      </div>
      <div class="skill-description">${skill.description || '暂无描述'}</div>
      <div class="skill-meta">
        <span>📦 版本: ${skill.version}</span>
        <span>🔢 使用次数: ${skill.usageCount}</span>
        <span>🕐 最后使用: ${formatTime(skill.lastUsed)}</span>
      </div>
      <div class="skill-actions">
        <button class="btn btn-secondary" onclick="toggleSkillStatus('${skill.id}')">
          ${skill.status === 'active' ? '停用' : '启用'}
        </button>
        <button class="btn btn-danger" onclick="deleteSkill('${skill.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

// 渲染日志
function renderLogs() {
  const container = document.getElementById('logs-list');

  if (logs.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #888;">暂无日志</p>';
    return;
  }

  container.innerHTML = logs.map(log => `
    <div class="log-entry ${log.status}">
      <div class="log-time">${formatTime(log.timestamp)}</div>
      <div class="log-message">
        <strong>${log.skillName}</strong> - ${log.action}: ${log.message}
      </div>
    </div>
  `).join('');
}

// 工具函数
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;

  return date.toLocaleString('zh-CN');
}

// Skill 操作
async function toggleSkillStatus(id) {
  const skill = skills.find(s => s.id === id);
  if (!skill) return;

  const newStatus = skill.status === 'active' ? 'inactive' : 'active';

  try {
    await fetch(`/api/skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillId: id,
        skillName: skill.name,
        action: '状态变更',
        status: 'info',
        message: `状态从 ${skill.status} 变更为 ${newStatus}`
      })
    });
  } catch (error) {
    console.error('更新 skill 状态失败:', error);
  }
}

async function deleteSkill(id) {
  if (!confirm('确定要删除这个 Skill 吗？')) return;

  const skill = skills.find(s => s.id === id);

  try {
    await fetch(`/api/skills/${id}`, { method: 'DELETE' });

    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillId: id,
        skillName: skill.name,
        action: '删除',
        status: 'error',
        message: 'Skill 已被删除'
      })
    });
  } catch (error) {
    console.error('删除 skill 失败:', error);
  }
}

// 模态框操作
function showAddSkillModal() {
  document.getElementById('add-skill-modal').classList.add('show');
}

function closeAddSkillModal() {
  document.getElementById('add-skill-modal').classList.remove('show');
  document.getElementById('add-skill-form').reset();
}

document.getElementById('add-skill-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newSkill = {
    name: document.getElementById('skill-name').value,
    url: document.getElementById('skill-url').value,
    version: document.getElementById('skill-version').value,
    description: document.getElementById('skill-description').value
  };

  try {
    const response = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSkill)
    });

    const skill = await response.json();

    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
        action: '添加',
        status: 'success',
        message: '新 Skill 已添加'
      })
    });

    closeAddSkillModal();
  } catch (error) {
    console.error('添加 skill 失败:', error);
    alert('添加失败，请重试');
  }
});

function clearLogs() {
  if (!confirm('确定要清空所有日志吗？')) return;
  logs = [];
  renderLogs();
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  connectWebSocket();
  loadSkills();
  loadLogs();
  loadStats();

  // 定期刷新统计数据
  setInterval(loadStats, 30000);
});
