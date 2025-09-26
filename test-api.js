#!/usr/bin/env node

// Test script to verify bot API is working
const fetch = require('node-fetch');

async function testBotAPI() {
  console.log('🧪 Testing Bot API');
  console.log('=' .repeat(30));
  
  const baseUrl = 'http://localhost:3000/api/bot';
  
  // Test cases
  const tests = [
    {
      name: 'Status Check',
      action: 'status',
      expected: 'Should return bot status'
    },
    {
      name: 'Invalid Action',
      action: 'invalid',
      expected: 'Should return error for invalid action'
    },
    {
      name: 'Empty Request',
      body: '',
      expected: 'Should handle empty request'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: test.body || JSON.stringify({ action: test.action })
      });
      
      const data = await response.json();
      console.log(`📊 Status: ${response.status}`);
      console.log(`📊 Response:`, data);
      
      if (response.ok) {
        console.log('✅ Test passed');
      } else {
        console.log('⚠️ Test returned error (expected for some tests)');
      }
      
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
  }
  
  console.log('\n✅ API tests completed!');
}

// Run the tests
testBotAPI().catch(console.error);
