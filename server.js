const express = require('express');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3088;

if (!API_BASE_URL || !API_KEY) {
    console.error('❌ 请在 .env 中配置 API_BASE_URL 和 API_KEY');
    process.exit(1);
}

// JSON body parser
app.use(express.json());

// --- API Proxy Routes ---

// POST /api/upload — 代理文件上传到 Dify
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '未收到文件' });
        }

        // Build FormData for Dify
        const formData = new FormData();
        formData.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
        formData.append('user', req.body.user || 'default-user');

        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            },
            body: formData
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Upload proxy error:', error.message);
        res.status(500).json({ message: '文件上传代理失败: ' + error.message });
    }
});

// POST /api/chat — 代理聊天请求到 Dify
app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Chat proxy error:', error.message);
        res.status(500).json({ message: '聊天代理失败: ' + error.message });
    }
});

// --- Static Files (production) ---
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ 电商配图助手后端已启动: http://localhost:${PORT}`);
    console.log(`   API 代理: ${API_BASE_URL}`);
});
