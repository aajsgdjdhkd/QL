// 完整代码 - 复制后直接部署
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    // 获取用户列表（从 KV 存储读取，如果没有则使用内存数组）
    async function getUsers() {
      if (env.USER_KV) {
        const data = await env.USER_KV.get('usernames', 'json')
        return data || []
      }
      return globalThis.__users || []
    }

    async function setUsers(users) {
      if (env.USER_KV) {
        await env.USER_KV.put('usernames', JSON.stringify(users))
      } else {
        globalThis.__users = users
      }
    }

    // API: 获取用户列表
    if (path === '/api/users' && request.method === 'GET') {
      const users = await getUsers()
      return new Response(JSON.stringify(users), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // API: 添加用户
    if (path === '/api/users' && request.method === 'POST') {
      const { username } = await request.json()
      if (!username) {
        return new Response('Username required', { status: 400 })
      }
      const users = await getUsers()
      if (!users.includes(username)) {
        users.push(username)
        await setUsers(users)
      }
      return new Response(JSON.stringify(users), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // API: 删除用户
    if (path === '/api/users' && request.method === 'DELETE') {
      const { username } = await request.json()
      let users = await getUsers()
      users = users.filter(u => u !== username)
      await setUsers(users)
      return new Response(JSON.stringify(users), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 首页 HTML（简约黑白风格）
    if (path === '/') {
      const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QL Service · 用户管理</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0a0a;
            font-family: system-ui, -apple-system, sans-serif;
            color: #e6e6e6;
            padding: 2rem;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            max-width: 600px;
            width: 100%;
            background: rgba(18, 18, 22, 0.9);
            border-radius: 2rem;
            padding: 2rem;
            box-shadow: 0 20px 35px -12px rgba(0,0,0,0.5);
        }
        h1 { text-align: center; font-size: 2rem; margin-bottom: 1rem; }
        .sub { text-align: center; color: #888; margin-bottom: 2rem; font-size: 0.8rem; }
        .info-card {
            background: #111;
            padding: 1rem;
            border-radius: 1rem;
            margin-bottom: 1.5rem;
            border-left: 3px solid #555;
        }
        .info-card p { font-size: 0.85rem; line-height: 1.4; color: #ccc; }
        .input-group { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .input-group input {
            flex: 1;
            padding: 0.8rem;
            border-radius: 1rem;
            border: 1px solid #333;
            background: #0c0c10;
            color: white;
            font-size: 0.9rem;
        }
        .input-group button {
            padding: 0.8rem 1.5rem;
            border-radius: 1rem;
            border: none;
            background: #2c2c34;
            color: white;
            cursor: pointer;
        }
        .input-group button:hover { background: #3d3d48; }
        .user-list { margin-top: 1rem; }
        .user-card {
            background: #101014;
            padding: 0.7rem 1rem;
            margin: 0.5rem 0;
            border-radius: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #24242c;
        }
        .delete-btn {
            background: none;
            border: none;
            color: #aa5555;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0 0.5rem;
        }
        .delete-btn:hover { color: #ff8888; }
        .empty { text-align: center; color: #666; padding: 1rem; }
        footer { text-align: center; margin-top: 2rem; color: #555; font-size: 0.7rem; }
        .error { color: #dd8888; font-size: 0.8rem; margin-top: 0.5rem; text-align: center; }
    </style>
</head>
<body>
<div class="container">
    <h1>QL Service</h1>
    <div class="sub">credential manager</div>
    
    <div class="info-card">
        <p><strong>为什么要添加用户名？</strong><br>此列表用于「图形界面授权」—— 添加后的用户名将获得访问特定 GUI 面板的权限。</p>
    </div>
    
    <div class="input-group">
        <input type="text" id="usernameInput" placeholder="输入用户名，例如：axjx_7">
        <button id="addBtn">+ 添加</button>
    </div>
    
    <div style="margin-top: 1rem;">
        <div style="color:#888; margin-bottom:0.5rem;">已授权的用户名</div>
        <div id="userList" class="user-list"></div>
    </div>
    <footer>QL Service · 用户列表存储于服务端</footer>
</div>

<script>
    async function loadUsers() {
        const res = await fetch('/api/users');
        const users = await res.json();
        const container = document.getElementById('userList');
        if (users.length === 0) {
            container.innerHTML = '<div class="empty">暂无用户，请添加</div>';
            return;
        }
        container.innerHTML = users.map(u => \`
            <div class="user-card">
                <span>\${escapeHtml(u)}</span>
                <button class="delete-btn" onclick="deleteUser('\${escapeHtml(u)}')">✕</button>
            </div>
        \`).join('');
    }
    
    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    async function deleteUser(username) {
        await fetch('/api/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        loadUsers();
    }
    
    document.getElementById('addBtn').onclick = async () => {
        const input = document.getElementById('usernameInput');
        const username = input.value.trim();
        if (!username) return;
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        input.value = '';
        loadUsers();
    };
    
    loadUsers();
</script>
</body>
</html>`
      return new Response(html, { headers: { 'Content-Type': 'text/html' } })
    }

    return new Response('Not Found', { status: 404 })
  }
}
