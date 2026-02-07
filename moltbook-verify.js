const axios = require('axios');
const fs = require('fs');

const CONFIG_PATH = 'C:/Users/5900x/.config/moltbook/credentials.json';
const API_BASE = 'https://www.moltbook.com/api/v1';

async function verify() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const apiKey = config.api_key;
  
  const payload = {
    verification_code: "99489b3dd391e7c406d8d7cbaef20868861f4271441760cbf645d410962c19e2",
    answer: "25.00"
  };

  try {
    const res = await axios.post(`${API_BASE}/verify`, payload, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
  }
}

verify();
