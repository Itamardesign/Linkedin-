async function generateAIComment() {
  // Retrieve API key from Chrome storage
  const result = await chrome.storage.sync.get(['openaiApiKey']);
  const apiKey = result.openaiApiKey || localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    alert('Please set your OpenAI API key in the extension popup first.');
    return;
  }

  // Rest of the function remains the same...
}
