#!/usr/bin/env node

// Test script to verify bot startup works
const fetch = require('node-fetch');

async function testBotStartup() {
  console.log('🧪 Testing Bot Startup');
  console.log('=' .repeat(30));
  
  try {
    console.log('🚀 Starting bot...');
    const response = await fetch('http://localhost:3000/api/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });
    
    const data = await response.json();
    console.log('📊 Response:', data);
    
    if (data.success) {
      console.log('✅ Bot started successfully!');
      
      // Wait a moment then check status
      console.log('⏳ Waiting 3 seconds then checking status...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await fetch('http://localhost:3000/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      
      const statusData = await statusResponse.json();
      console.log('📊 Status:', statusData);
      
      if (statusData.isActive) {
        console.log('✅ Bot is active and running!');
      } else {
        console.log('⚠️ Bot is not active');
      }
      
    } else {
      console.log('❌ Bot failed to start:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBotStartup().catch(console.error);
