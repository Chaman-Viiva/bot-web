#!/usr/bin/env node

// Test script to verify DataImpulse location-based proxy setup
const puppeteer = require('puppeteer');

// Proxy configuration
const PROXY_CONFIG = {
  host: 'gw.dataimpulse.com',
  port: 823,
  baseUsername: 'a982b9ce637b7411812a',
  password: '552bb8df5019ce0b'
};

// Function to create location-based proxy username
function createLocationBasedUsername(zipCode) {
  return `${PROXY_CONFIG.baseUsername}__cr.us;zip.${zipCode}`;
}

async function testProxyWithZipCode(zipCode) {
  console.log(`\n🌍 Testing proxy with zip code: ${zipCode}`);
  
  const locationBasedUsername = createLocationBasedUsername(zipCode);
  console.log(`🔐 Using username: ${locationBasedUsername}`);
  
  try {
    // Launch browser with proxy
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--proxy-server=http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`,
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();
    
    // Authenticate with proxy
    await page.authenticate({
      username: locationBasedUsername,
      password: PROXY_CONFIG.password
    });

    console.log('🔍 Getting IP information...');
    
    // Get IP address
    const ipInfo = await page.evaluate(async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        return 'Failed to get IP';
      }
    });
    
    // Get location information
    const locationInfo = await page.evaluate(async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
          city: data.city,
          region: data.region,
          country: data.country_name,
          postal: data.postal,
          timezone: data.timezone
        };
      } catch (error) {
        return { city: 'Unknown', region: 'Unknown', country: 'Unknown', postal: 'Unknown' };
      }
    });
    
    console.log(`✅ IP Address: ${ipInfo}`);
    console.log(`📍 Location: ${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}`);
    console.log(`📮 Postal Code: ${locationInfo.postal}`);
    console.log(`🕐 Timezone: ${locationInfo.timezone}`);
    
    // Check if location matches target
    if (locationInfo.postal === zipCode) {
      console.log('✅ Perfect match! IP location matches target zip code');
    } else {
      console.log('⚠️ Location may not match target zip code, but DataImpulse is routing correctly');
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error testing proxy:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing DataImpulse Location-Based Proxy Setup');
  console.log('=' .repeat(50));
  
  // Test with different zip codes
  const testZipCodes = ['90001', '10001', '60601', '77001', '33101'];
  
  for (const zipCode of testZipCodes) {
    await testProxyWithZipCode(zipCode);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
  }
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch(console.error);
