// ══════════════════════════════════════════
// IMPORTS & CONFIG
// ══════════════════════════════════════════
const http = require('http');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const PORT = process.env.PORT || 5000;

function getOpenAIClient() {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
};

// ══════════════════════════════════════════
// AI AGENT
// ══════════════════════════════════════════
const SYSTEM_PROMPT = `You are the Blink Beyond AI assistant. Answer questions about this digital marketing agency concisely. Proactively use the surf_page tool to physically guide the user to the relevant sections of the website as you explain them. Do not use markdown or complex formatting in your answers because they will be read aloud through text-to-speech.`;

const surfPageTool = {
  type: "function",
  function: {
    name: "surf_page",
    description: "Scroll to elements or navigate to pages to show things to the user.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["scroll", "navigate"],
          description: "Use 'scroll' to move to an element on the current page. Use 'navigate' to go to a different page."
        },
        target: {
          type: "string",
          description: "If action is 'scroll', provide a CSS selector (e.g., '.footer', '#services', '.hero'). If action is 'navigate', provide a pathname (e.g., 'index.html', 'about.html', 'services.html', 'contact.html')."
        }
      },
      required: ["action", "target"]
    }
  }
};

async function handleAgentRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Message is required' }));
      return;
    }

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      tools: [surfPageTool],
      tool_choice: "auto",
    });

    const choice = response.choices[0];
    const responseMessage = choice.message;

    let surfCommand = null;
    let replyText = responseMessage.content;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === 'surf_page') {
        surfCommand = JSON.parse(toolCall.function.arguments);
      }
      if (!replyText) {
        replyText = surfCommand.action === 'scroll'
          ? "Let me show you that right here."
          : "Taking you there now.";
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ response: replyText, surfCommand }));

  } catch (error) {
    console.error('Agent Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'An error occurred during processing.',
      response: "I'm sorry, I'm experiencing some technical difficulties right now."
    }));
  }
}

// ══════════════════════════════════════════
// SERVER
// ══════════════════════════════════════════
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/agent')) {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', async () => {
      try {
        req.body = body.length > 0 ? JSON.parse(Buffer.concat(body).toString()) : {};
      } catch (e) {
        req.body = {};
      }
      await handleAgentRequest(req, res);
    });
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  if (filePath.includes('?')) {
    filePath = filePath.split('?')[0];
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, '404.html'), (err404, content404) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content404, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// ══════════════════════════════════════════
// SERVER START
// ══════════════════════════════════════════
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Blink Beyond Server running at http://localhost:${PORT}/`);
});
