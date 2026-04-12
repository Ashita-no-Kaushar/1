// ══════════════════════════════════════════
// AI VOICE AGENT CONTROLLER
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const agentBtn = document.getElementById('ai-agent-btn');
  if (!agentBtn) return; // If button isn't injected, do nothing.

  let isListening = false;
  let isSpeaking = false;
  let isThinking = false;

  // Set up Speech Recognition (STT)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop listening after one phrase
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      updateState();
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('User said:', transcript);
      
      // Send to Backend
      await processWithAI(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      isListening = false;
      updateState();
    };

    recognition.onend = () => {
      isListening = false;
      updateState();
    };
  } else {
    console.warn("Speech Recognition API is not supported in this browser.");
    agentBtn.style.display = 'none'; // Hide if not supported
    return;
  }

  // Handle Button Click
  agentBtn.addEventListener('click', () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      updateState();
      return;
    }

    if (isListening) {
      recognition.stop();
    } else if (!isThinking) {
      try {
        recognition.start();
      } catch (err) {
        console.error("Recognition start error (likely already started)", err);
      }
    }
  });

  // State Management & UI Updates
  function updateState() {
    agentBtn.classList.remove('state-listening', 'state-thinking', 'state-speaking', 'state-idle');
    
    if (isListening) {
      agentBtn.classList.add('state-listening');
    } else if (isThinking) {
      agentBtn.classList.add('state-thinking');
    } else if (isSpeaking) {
      agentBtn.classList.add('state-speaking');
    } else {
      agentBtn.classList.add('state-idle');
    }
  }

  updateState(); // Set initial state to idle

  // Backend Processing
  async function processWithAI(messageText) {
    isThinking = true;
    updateState();

    try {
      // Assuming a generic `/api/agent` route is standard for Vercel functions/Next.js/etc
      // In local testing without Vercel CLI, we might need a direct URL. 
      // Using relative URL standard for serverless.
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      isThinking = false;
      
      // Execute DOM commands first
      if (data.surfCommand) {
        executeSurfCommand(data.surfCommand);
      }

      // Then speak response
      if (data.response) {
        speakResponse(data.response);
      } else {
        updateState();
      }

    } catch (error) {
      console.error('API execution failed:', error);
      isThinking = false;
      speakResponse("I'm sorry, I'm having trouble connecting right now.");
    }
  }

  // DOM Execution (Agent taking action)
  function executeSurfCommand(command) {
    console.log("Agent Command Executing:", command);
    
    if (command.action === 'navigate' && command.target) {
      const targetPath = command.target.startsWith('/') ? command.target : '/' + command.target;
      // Do not navigate immediately if the target is the exact same path to avoid reload
      const currentPath = window.location.pathname;
      if (currentPath !== targetPath && !(currentPath === '/' && targetPath === '/index.html')) {
        setTimeout(() => {
          window.location.href = targetPath;
        }, 1500); // Give user a moment to hear the agent start speaking
      }
    } 
    else if (command.action === 'scroll' && command.target) {
      const targetElement = document.querySelector(command.target);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.warn('Target element not found for scroll action:', command.target);
      }
    }
  }

  // Text-to-Speech (TTS)
  function speakResponse(text) {
    if (!window.speechSynthesis) {
        console.warn("Speech Synthesis API not supported.");
        updateState();
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to pick an en-US premium voice if available
    let voices = window.speechSynthesis.getVoices();
    function setVoiceAndSpeak() {
      // Find a good english voice, preferably Google or Samantha
      const voice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha')) 
                  || voices.find(v => v.lang.startsWith('en'));
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => {
        isSpeaking = true;
        updateState();
      };
      
      utterance.onend = () => {
        isSpeaking = false;
        updateState();
      };
      
      utterance.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        isSpeaking = false;
        updateState();
      };

      window.speechSynthesis.speak(utterance);
    }

    // Handle voice loading which is sometimes async in chrome
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        setVoiceAndSpeak();
      };
    } else {
      setVoiceAndSpeak();
    }
  }
});
