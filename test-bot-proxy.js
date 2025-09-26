#!/usr/bin/env node

// Test script to verify bot's proxy configuration
const puppeteer = require('puppeteer');

// Proxy configuration (same as bot)
const PROXY_CONFIG = {
  host: 'gw.dataimpulse.com',
  port: 823,
  baseUsername: 'a982b9ce637b7411812a',
  password: '552bb8df5019ce0b'
};

// Function to create location-based proxy username (same as bot)
function createLocationBasedUsername(zipCode) {
  return `${PROXY_CONFIG.baseUsername}__cr.us;zip.${zipCode}`;
}

async function testBotProxySetup(zipCode) {
  console.log(`\n🧪 Testing Bot Proxy Setup with zip code: ${zipCode}`);
  
  const locationBasedUsername = createLocationBasedUsername(zipCode);
  console.log(`🔐 Username: ${locationBasedUsername}`);
  console.log(`🔐 Password: ${PROXY_CONFIG.password}`);
  console.log(`🌐 Proxy: ${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`);
  
  try {
    // Launch browser with same configuration as bot
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--start-maximized',
        `--proxy-server=http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`,
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--allow-running-insecure-content',
        '--disable-extensions',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const page = await browser.newPage();
    
    // Authenticate with proxy (same as bot)
    console.log('🔐 Authenticating with proxy...');
    await page.authenticate({
      username: locationBasedUsername,
      password: PROXY_CONFIG.password
    });

    console.log('🔍 Testing IP address...');
    
    // Test IP
    await page.goto('https://api.ipify.org?format=json', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const ipInfo = await page.evaluate(() => {
      return document.body.textContent;
    });
    
    console.log(`🌐 IP Address: ${ipInfo}`);
    
    // Test location
    await page.goto('https://ipinfo.io/json', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const locationInfo = await page.evaluate(() => {
      try {
        const data = JSON.parse(document.body.textContent);
        return {
          city: data.city,
          region: data.region,
          country: data.country,
          postal: data.postal
        };
      } catch (error) {
        return { city: 'Unknown', region: 'Unknown', country: 'Unknown', postal: 'Unknown' };
      }
    });
    
    console.log(`📍 Location: ${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}`);
    console.log(`📮 Postal: ${locationInfo.postal}`);
    
    if (locationInfo.country === 'US') {
      console.log('✅ SUCCESS: Bot proxy is working correctly!');
    } else {
      console.log(`❌ ISSUE: Bot proxy is routing to ${locationInfo.country} instead of US`);
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error testing bot proxy:', error.message);
  }
}

async function runBotProxyTests() {
  console.log('🧪 Testing Bot Proxy Configuration');
  console.log('=' .repeat(50));
  
  // Test with different zip codes
  const testZipCodes = ['90001', '10001', '60601'];
  
  for (const zipCode of testZipCodes) {
    await testBotProxySetup(zipCode);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ Bot proxy tests completed!');
}

// Run the tests
runBotProxyTests().catch(console.error);
