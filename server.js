// backend/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Node <18, nếu Node 18+ có thể dùng global fetch
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Lấy API key từ biến môi trường (an toàn)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Thiếu OPENAI_API_KEY trong file .env');
  process.exit(1);
}

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Thiếu message' });

  const systemPrompt = `Bạn là chuyên gia tài chính cá nhân, tư vấn dựa trên dữ liệu thực tế từ dashboard của người dùng.
Dữ liệu hiện tại: Mục tiêu: ${context.target} VND, Tiết kiệm/tháng: ${context.monthlySave} VND, Lãi suất: ${context.interestRate}%/năm, Thời gian: ${context.months} tháng, Lạm phát: ${context.inflation}%/năm, Tổng tiền dự kiến: ${context.currentFV} VND.
Trả lời ngắn gọn, cụ thể, có số liệu. Nếu câu hỏi ngoài tài chính, lịch sự từ chối.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Lỗi API');
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server chạy tại http://localhost:${PORT}`);
});