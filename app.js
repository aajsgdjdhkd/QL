const express = require('express');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 内嵌 EJS 模板
app.set('view engine', 'ejs');
app.engine('ejs', (path, data, cb) => {
    const template = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QL Service · 用户管理</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0a0a;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #e6e6e6;
            padding: 2rem 1.5rem;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            max-width: 620px;
            width: 100%;
            margin: 0 auto;
            background: rgba(18, 18, 22, 0.85);
            backdrop-filter: blur(2px);
            border-radius: 2rem;
            padding: 1.8rem 1.8rem 2.2rem;
            box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03);
        }
        .brand { text-align: center; margin-bottom: 2rem; }
        .brand h1 {
            font-size: 2.1rem;
            font-weight: 550;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #f0f0f0 0%, #b0b0b0 100%);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }
        .brand .badge {
            display: inline-block;
            margin-top: 0.5rem;
            font-size: 0.7rem;
            background: #1e1e24;
            padding: 0.2rem 0.8rem;
            border-radius: 40px;
            color: #aaa;
            border: 0.5px solid #2c2c34;
        }
        .info-card {
            background: #111114;
            border-radius: 1.4rem;
            padding: 1.2rem 1.5rem;
            margin-bottom: 2rem;
            border-left: 3px solid #3a3a44;
        }
        .info-card p { font-size: 0.9rem; line-height: 1.5; color: #cbcbd5; }
        .info-card strong { color: #e0e0e0; }
        .add-section { margin-bottom: 2rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.8rem; }
        .input-field {
            width: 100%;
            background: #0c0c10;
            border: 1px solid #28282f;
            padding: 0.85rem 1.2rem;
            border-radius: 1.2rem;
            font-size: 0.95rem;
            color: #f0f0f0;
            outline: none;
            font-family: monospace;
        }
        .input-field:focus { border-color: #5a5a70; background: #111116; }
        .input-field::placeholder { color: #494954; }
        .btn {
            background: #1f1f26;
            border: none;
            padding: 0.85rem 1rem;
            border-radius: 1.2rem;
            font-weight: 500;
            font-size: 0.9rem;
            color: #ececec;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary { background: #2c2c34; color: white; }
        .btn-primary:hover { background: #3d3d48; }
        .list-title {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 1.5rem 0 1rem 0;
            color: #888;
        }
        .user-list { display: flex; flex-direction: column; gap: 0.7rem; }
        .user-card {
            background: #101014;
            border-radius: 1.2rem;
            padding: 0.7rem 1.2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #24242c;
        }
        .user-name {
            font-family: monospace;
            font-size: 0.9rem;
            font-weight: 450;
            word-break: break-all;
            padding-right: 0.8rem;
        }
        .delete-form { margin: 0; }
        .delete-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: #aa5555;
            padding: 0 0.3rem;
            transition: 0.1s;
            font-family: monospace;
        }
        .delete-btn:hover { color: #ff8888; }
        .empty-msg {
            text-align: center;
            color: #5a5a66;
            padding: 1.2rem;
            font-size: 0.85rem;
        }
        .error-msg {
            background: #2a1515;
            border-left: 3px solid #aa5555;
            padding: 0.6rem 1rem;
            border-radius: 0.8rem;
            margin-bottom: 1rem;
            font-size: 0.8rem;
            color: #dd8888;
        }
        footer {
            font-size: 0.7rem;
            text-align: center;
            margin-top: 2rem;
            color: #484852;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="brand">
        <h1>QL Service</h1>
        <div class="badge">credential manager</div>
    </div>

    <div class="info-card">
        <p><strong>为什么要添加用户名？</strong><br>
        此列表用于「图形界面授权」—— 添加后的用户名将获得访问特定 GUI 面板的权限。<br>
        你可以通过此面板统一管理允许使用扩展功能的用户，删除后立即失效。</p>
    </div>

    <% if (error) { %>
        <div class="error-msg"><%= error %></div>
    <% } %>

    <div class="add-section">
        <form action="/add-user" method="POST" class="input-group">
            <input type="text" name="username" class="input-field" placeholder="输入用户名，例如：axjx_7" autocomplete="off">
            <button type="submit" class="btn btn-primary">+ 添加用户名</button>
        </form>
    </div>

    <div class="list-title">已授权的用户名</div>
    <div class="user-list">
        <% if (usernames.length === 0) { %>
            <div class="empty-msg">暂无用户，请添加</div>
        <% } else { %>
            <% usernames.forEach(username => { %>
                <div class="user-card">
                    <span class="user-name"><%= username %></span>
                    <form action="/delete-user" method="POST" class="delete-form">
                        <input type="hidden" name="username" value="<%= username %>">
                        <button type="submit" class="delete-btn">✕</button>
                    </form>
                </div>
            <% }); %>
        <% } %>
    </div>
    <footer>QL Service · 用户列表存储于服务端</footer>
</div>
</body>
</html>
    `;
    return cb(null, template);
});

// 存储用户名列表
let usernames = [];

// 路由
app.get('/', (req, res) => {
    res.render('index', { usernames, error: null });
});

app.post('/add-user', (req, res) => {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
        return res.render('index', { usernames, error: '用户名不能为空' });
    }
    
    if (usernames.includes(username)) {
        return res.render('index', { usernames, error: '用户名已存在' });
    }
    
    usernames.push(username);
    res.redirect('/');
});

app.post('/delete-user', (req, res) => {
    const { username } = req.body;
    usernames = usernames.filter(u => u !== username);
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`服务运行在 http://localhost:${port}`);
});
