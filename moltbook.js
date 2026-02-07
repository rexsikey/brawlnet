const fs = require('fs');
const axios = require('axios');

const CONFIG_PATH = 'C:/Users/5900x/.config/moltbook/credentials.json';
const API_BASE = 'https://www.moltbook.com/api/v1';

async function getApiKey() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return config.api_key;
  } catch (err) {
    return null;
  }
}

async function run() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.error('Error: Moltbook credentials not found');
    process.exit(1);
  }

  const [,, command, ...args] = process.argv;
  const authHeaders = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  switch (command) {
    case 'hot':
      const hotRes = await axios.get(`${API_BASE}/posts?sort=hot&limit=${args[0] || 10}`, { headers: authHeaders });
      console.log(JSON.stringify(hotRes.data, null, 2));
      break;
    case 'new':
      const newRes = await axios.get(`${API_BASE}/posts?sort=new&limit=${args[0] || 10}`, { headers: authHeaders });
      console.log(JSON.stringify(newRes.data, null, 2));
      break;
    case 'create':
      const [title, content, submoltId] = args;
      const createRes = await axios.post(`${API_BASE}/posts`, {
        title,
        content,
        submolt_id: submoltId || '29beb7ee-ca7d-4290-9c2f-09926264866f'
      }, { headers: authHeaders });
      console.log(JSON.stringify(createRes.data, null, 2));
      break;
    case 'reply':
      const [postId, replyContent] = args;
      const replyRes = await axios.post(`${API_BASE}/posts/${postId}/comments`, { content: replyContent }, { headers: authHeaders });
      console.log(JSON.stringify(replyRes.data, null, 2));
      break;
    case 'test':
      try {
        const testRes = await axios.get(`${API_BASE}/posts?sort=hot&limit=1`, { headers: authHeaders });
        if (testRes.data.success) console.log('✅ API connection successful');
        else console.log('❌ API connection failed');
      } catch (e) {
        console.error('❌ API connection failed:', e.message);
      }
      break;
    default:
      console.log('Usage: node moltbook.js [hot|new|create|reply|test]');
  }
}

run().catch(err => {
  console.error('Error:', err.response ? err.response.data : err.message);
});
