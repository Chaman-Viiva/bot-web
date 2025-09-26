#!/usr/bin/env node

// Test script to verify DataImpulse location-based proxy
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

async function testDataImpulseProxy(zipCode) {
  console.log(`\n🌍 Testing DataImpulse proxy with zip code: ${zipCode}`);
  
  const locationBasedUsername = createLocationBasedUsername(zipCode);
  console.log(`🔐 Username format: ${locationBasedUsername}`);
  console.log(`🔐 Password: ${PROXY_CONFIG.password}`);
  console.log(`🌐 Proxy: ${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`);
  
  try {
    // Launch browser with proxy
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--proxy-server=http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`,
        '--disable-web-security',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors'
      ]
    });

    const page = await browser.newPage();
    
    // Authenticate with proxy using location-based username
    console.log('🔐 Authenticating with DataImpulse proxy...');
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
    
    // Get detailed location information
    const locationInfo = await page.evaluate(async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
          city: data.city,
          region: data.region,
          country: data.country_name,
          postal: data.postal,
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude
        };
      } catch (error) {
        return { 
          city: 'Unknown', 
          region: 'Unknown', 
          country: 'Unknown', 
          postal: 'Unknown',
          timezone: 'Unknown',
          latitude: 'Unknown',
          longitude: 'Unknown'
        };
      }
    });
    
    console.log(`✅ IP Address: ${ipInfo}`);
    console.log(`📍 Location: ${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}`);
    console.log(`📮 Postal Code: ${locationInfo.postal}`);
    console.log(`🕐 Timezone: ${locationInfo.timezone}`);
    console.log(`🌐 Coordinates: ${locationInfo.latitude}, ${locationInfo.longitude}`);
    
    // Check if location matches target
    if (locationInfo.country === 'United States') {
      console.log('✅ SUCCESS: Got US-based IP address!');
      if (locationInfo.postal === zipCode) {
        console.log('🎯 PERFECT: IP location matches target zip code!');
      } else {
        console.log('⚠️ US IP but may not match exact zip code');
      }
    } else {
      console.log(`❌ FAILED: Got ${locationInfo.country} IP instead of US`);
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error testing proxy:', error.message);
  }
}

async function runDataImpulseTests() {
  console.log('🧪 Testing DataImpulse Location-Based Proxy');
  console.log('=' .repeat(60));
  
  // Test with different zip codes
  const testZipCodes = ['90001', '10001', '60601', '77001', '33101'];
  
  for (const zipCode of testZipCodes) {
    await testDataImpulseProxy(zipCode);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait between tests
  }
  
  console.log('\n✅ All DataImpulse tests completed!');
}

// Run the tests
runDataImpulseTests().catch(console.error);
