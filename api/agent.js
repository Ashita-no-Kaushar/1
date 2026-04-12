const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        response: 'System error: Missing API Key configuration.'
      });
    }

    const response = await openai.chat.completions.create({
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

    // Check if the model decided to call the function
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === 'surf_page') {
        surfCommand = JSON.parse(toolCall.function.arguments);
      }
      
      // If the model called a function but didn't provide a text response,
      // we might want to generate a quick placeholder or fetch a follow-up.
      // Usually, gpt-4o-mini provides content ALONG with the tool call.
      if (!replyText) {
         if (surfCommand.action === 'scroll') {
             replyText = "Let me show you that right here.";
         } else {
             replyText = "Taking you there now.";
         }
      }
    }

    res.status(200).json({
      response: replyText,
      surfCommand: surfCommand
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'An error occurred during processing.',
      response: "I'm sorry, I'm experiencing some technical difficulties right now."
    });
  }
};
