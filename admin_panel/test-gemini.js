// Test script to check available Gemini models
const API_KEY = 'AIzaSyDLqwTb8GgaqGjnIj2dIcmdRPTnuAvnxpk';

async function listModels() {
  console.log('Fetching available models...\n');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error:', data);
      return;
    }
    
    console.log('Available models:');
    data.models?.forEach(model => {
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`✓ ${model.name}`);
      }
    });
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

async function testGenerateContent() {
  console.log('\n\nTesting generateContent with gemini-1.5-flash...\n');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say hello in one sentence.' }]
          }]
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error:', JSON.stringify(data, null, 2));
      return;
    }
    
    console.log('Success! Response:');
    console.log(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

listModels().then(() => testGenerateContent());
