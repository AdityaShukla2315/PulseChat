#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🤖 Setting up AI features for PULSECHAT...\n');

const envPath = path.join(__dirname, '.env');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please create one first.');
  process.exit(1);
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if GEMINI_API_KEY already exists
if (envContent.includes('GEMINI_API_KEY=') && !envContent.includes('GEMINI_API_KEY=your_gemini_api_key_here')) {
  console.log('✅ Gemini API key already configured!');
} else {
  console.log('📝 Please follow these steps to set up AI features:\n');
  
  console.log('1. Get your Gemini API key:');
  console.log('   - Go to https://makersuite.google.com/app/apikey');
  console.log('   - Sign in with your Google account');
  console.log('   - Click "Create API Key"');
  console.log('   - Copy the generated API key\n');
  
  console.log('2. Update your .env file:');
  console.log('   - Replace "your_gemini_api_key_here" with your actual API key');
  console.log('   - Save the file\n');
  
  console.log('3. Translation features are powered by Gemini AI:');
  console.log('   - No additional setup required');
  console.log('   - Translation uses the same Gemini API key');
  console.log('   - Supports 12+ languages out of the box\n');
}

console.log('🚀 AI Features Available:');
console.log('   ✨ Smart Replies - Context-aware quick responses');
console.log('   📄 Message Summarization - Auto-generate conversation summaries');
console.log('   🛡️  Content Moderation - Real-time toxicity detection');
console.log('   🌍 Language Translation - Real-time message translation');
console.log('\n💡 Restart your server after updating the API key!');

// Test API connection if key is provided
if (process.argv.includes('--test')) {
  console.log('\n🧪 Testing API connection...');
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.log('❌ Please set your GEMINI_API_KEY first');
      process.exit(1);
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent("Hello, this is a test message.");
    console.log('✅ Gemini API connection successful!');
    console.log('📝 Test response:', result.response.text().slice(0, 100) + '...');
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}