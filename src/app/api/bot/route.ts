import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser, Page } from 'puppeteer';

export interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
}

// Proxy configuration
const PROXY_CONFIG = {
  host: 'gw.dataimpulse.com',
  port: 823,
  baseUsername: 'a982b9ce637b7411812a',
  password: '552bb8df5019ce0b'
};

// Function to create location-based proxy username
function createLocationBasedUsername(zipCode: string): string {
  // Format: baseUsername__cr.us;zip.ZIPCODE (matching DataImpulse documentation)
  return `${PROXY_CONFIG.baseUsername}__cr.us;zip.${zipCode}`;
}

// Function to validate US zip code format
function validateUSZipCode(zipCode: string): boolean {
  // US zip codes are 5 digits or 5+4 format
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

// Function to get US state from zip code (basic mapping)
function getStateFromZipCode(zipCode: string): string {
  const zip = parseInt(zipCode.substring(0, 5));
  
  // Basic US zip code to state mapping
  if (zip >= 1000 && zip <= 2799) return 'MA';
  if (zip >= 2800 && zip <= 2999) return 'RI';
  if (zip >= 3000 && zip <= 3899) return 'NH';
  if (zip >= 3900 && zip <= 4999) return 'ME';
  if (zip >= 5000 && zip <= 5999) return 'VT';
  if (zip >= 6000 && zip <= 6999) return 'CT';
  if (zip >= 7000 && zip <= 8999) return 'NJ';
  if (zip >= 10000 && zip <= 14999) return 'NY';
  if (zip >= 15000 && zip <= 19999) return 'PA';
  if (zip >= 20000 && zip <= 29999) return 'DC';
  if (zip >= 30000 && zip <= 39999) return 'GA';
  if (zip >= 40000 && zip <= 49999) return 'KY';
  if (zip >= 50000 && zip <= 59999) return 'IA';
  if (zip >= 60000 && zip <= 69999) return 'IL';
  if (zip >= 70000 && zip <= 79999) return 'LA';
  if (zip >= 80000 && zip <= 89999) return 'CO';
  if (zip >= 90000 && zip <= 99999) return 'CA';
  
  return 'US'; // Default fallback
}

let browser: Browser | null = null;
let sourcePage: Page | null = null;
let targetPage: Page | null = null;
let isBotActive = false;
let capturedData: FormData | null = null;

export async function POST(request: NextRequest) {
  try {
    // Parse JSON with error handling
    let requestData;
    try {
      requestData = await request.json();
    } catch (jsonError) {
      console.error('❌ JSON parsing error:', jsonError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { action } = requestData;

    if (!action) {
      return NextResponse.json({ 
        error: 'Missing action parameter' 
      }, { status: 400 });
    }

    try {
      switch (action) {
      case 'start':
        return await startBot();
      case 'capture':
        return await captureFormData();
      case 'transfer':
        return await transferData();
      case 'stop':
        return await stopBot();
      case 'storeFormData':
        const { formData } = await request.json();
        capturedData = formData;
        console.log('✅ Form data stored from client:', formData);
        return NextResponse.json({ 
          success: true, 
          message: 'Form data stored successfully' 
        });
      case 'status':
        return NextResponse.json({ 
          isActive: isBotActive, 
          hasData: capturedData !== null,
          capturedData 
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } catch (error) {
      console.error('Bot API error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function startBot() {
  console.log('🚀 Starting PuppeteerBot...');
  isBotActive = true;

  try {
    // Launch browser with proxy
    console.log('🌐 Launching browser with proxy...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--start-maximized',
        `--proxy-server=http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`,
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--ignore-certificate-errors-spki-list',
        '--allow-running-insecure-content',
        '--disable-extensions',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // Open source website
    console.log('📄 Opening source website...');
    sourcePage = await browser.newPage();
    
    // Authenticate with proxy (using default username for source page)
    console.log('🔐 Authenticating with proxy...');
    await sourcePage.authenticate({
      username: PROXY_CONFIG.baseUsername,
      password: PROXY_CONFIG.password
    });
    
    // Try HTTPS first, fallback to HTTP if needed
    let sourceUrl = 'https://finalexpensequote.us/opt_in';
    try {
      console.log('🔒 Trying HTTPS first...');
      await sourcePage.goto(sourceUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      console.log('✅ Source website loaded via HTTPS');
    } catch (httpsError) {
      console.log('⚠️ HTTPS failed, trying HTTP...');
      sourceUrl = 'http://finalexpensequote.us/opt_in';
      await sourcePage.goto(sourceUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      console.log('✅ Source website loaded via HTTP');
    }
    
    console.log('👁️ Monitoring form for submissions...');

    // Set up form monitoring
    await setupFormMonitoring();

    return NextResponse.json({ 
      success: true, 
      message: 'Bot started successfully',
      isActive: isBotActive 
    });

  } catch (error) {
    console.error('❌ Error starting bot:', error);
    isBotActive = false;
    
    // Clean up on error
    if (browser) {
      try {
        await browser.close();
        browser = null;
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    sourcePage = null;
    targetPage = null;
    
    return NextResponse.json({ 
      success: false, 
      error: `Failed to start bot: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

async function setupFormMonitoring() {
  if (!sourcePage) {
    console.log('❌ Source page not available for form monitoring');
    return;
  }

  console.log('🔍 Setting up form monitoring...');

  try {
  // Wait for form to be present
    await sourcePage.waitForSelector('form', { timeout: 15000 });
    console.log('✅ Form found on page');
  } catch (error) {
    console.log('⚠️ Form not found immediately, continuing with monitoring setup...');
    // Continue anyway, the monitoring script will handle form detection
  }

  // Set up form submission listener with multiple approaches
  await sourcePage.evaluate(() => {
    console.log('🔍 Setting up form monitoring...');
    
    // Function to capture form data
    function captureFormData() {
      console.log('🚨 FORM SUBMIT DETECTED!');
      
      // Capture form data with detailed logging
      console.log('🔍 CAPTURING INDIVIDUAL FIELD VALUES:');
      
      const firstName = (document.querySelector('input[name="firstName"], input[name="first_name"], input[placeholder*="First"]') as HTMLInputElement)?.value || '';
      console.log('👤 First Name:', firstName);
      
      const lastName = (document.querySelector('input[name="lastName"], input[name="last_name"], input[placeholder*="Last"]') as HTMLInputElement)?.value || '';
      console.log('👤 Last Name:', lastName);
      
      const phone = (document.querySelector('input[name="phone"], input[name="phoneNumber"], input[type="tel"]') as HTMLInputElement)?.value || '';
      console.log('📞 Phone:', phone);
      
      const email = (document.querySelector('input[name="email"], input[type="email"]') as HTMLInputElement)?.value || '';
      console.log('📧 Email:', email);
      
      const state = (document.querySelector('input[name="state"], select[name="state"]') as HTMLInputElement)?.value || '';
      console.log('🗺️ State:', state);
      
      const zipCode = (document.querySelector('input[name="zipCode"], input[name="zip"], input[name="zipcode"]') as HTMLInputElement)?.value || '';
      console.log('📮 Zip Code:', zipCode);
      
      const dateOfBirth = (document.querySelector('input[name="dateOfBirth"], input[name="dob"], input[name="birthDate"]') as HTMLInputElement)?.value || '';
      console.log('🎂 Date of Birth:', dateOfBirth);
      
      const formData = {
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: email,
        state: state,
        zipCode: zipCode,
        dateOfBirth: dateOfBirth
      };

      console.log('📊 COMPLETE CAPTURED FORM DATA:', formData);
      console.log('📊 Form Data JSON:', JSON.stringify(formData, null, 2));
      
      // Store data globally for access
      (window as any).capturedFormData = formData;
      
      // Also try to send data to the server immediately
      try {
        fetch('/api/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'storeFormData',
            formData: formData 
          })
        }).catch(err => console.log('Could not send data to server:', err));
      } catch (error) {
        console.log('Error sending data to server:', error);
      }
      
      // Show visual indicator that data was captured
      const indicator = document.createElement('div');
      indicator.innerHTML = '✅ FORM DATA CAPTURED! Bot will now transfer to destination...';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10B981;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: pulse 1s infinite;
      `;
      document.body.appendChild(indicator);
      
      return formData;
    }
    
    // Method 1: Override form.submit
    const form = document.querySelector('form');
    if (form) {
      console.log('✅ Form found, setting up submit listener');
      
      const originalSubmit = form.submit;
      form.submit = function() {
        captureFormData();
        originalSubmit.call(form);
      };
    }
    
    // Method 2: Add event listener to form
    if (form) {
      form.addEventListener('submit', function(e) {
        console.log('🚨 FORM SUBMIT EVENT DETECTED!');
        captureFormData();
      });
    }
    
    // Method 3: Monitor all input changes and button clicks
    document.addEventListener('click', function(e) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || (target as HTMLInputElement).type === 'submit' || target.textContent?.includes('Submit') || target.textContent?.includes('Get Quote')) {
        console.log('🚨 SUBMIT BUTTON CLICKED!');
        setTimeout(() => {
          captureFormData();
        }, 100);
      }
    });
    
    // Method 4: Monitor for any form submission
    document.addEventListener('submit', function(e) {
      console.log('🚨 DOCUMENT SUBMIT EVENT DETECTED!');
      captureFormData();
    });
    
    // Method 5: Monitor for page navigation (form submission often causes navigation)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        console.log('🚨 PAGE NAVIGATION DETECTED! Form likely submitted.');
        captureFormData();
        currentUrl = window.location.href;
      }
    }, 500);
    
    // Method 6: Monitor for form field changes and auto-capture when all fields are filled
    const requiredFields = ['firstName', 'lastName', 'phone', 'email', 'zipCode'];
    let fieldCheckInterval = setInterval(() => {
      let allFieldsFilled = true;
      for (const fieldName of requiredFields) {
        const field = document.querySelector(`input[name="${fieldName}"], input[name="${fieldName}_name"], input[placeholder*="${fieldName}"]`) as HTMLInputElement;
        if (!field || !field.value.trim()) {
          allFieldsFilled = false;
          break;
        }
      }
      
      if (allFieldsFilled) {
        console.log('🔍 All required fields are filled, monitoring for submission...');
        // Clear the interval since we found all fields
        clearInterval(fieldCheckInterval);
      }
    }, 1000);
    
    console.log('✅ All form monitoring methods set up');
  });

  console.log('✅ Form monitoring setup complete');
}

async function captureFormData() {
  console.log('🔍 Attempting to capture form data...');

  // First check if we already have captured data
  if (capturedData) {
    console.log('✅ Using previously captured data');
    return NextResponse.json({ 
      success: true, 
      data: capturedData,
      message: 'Form data already captured',
      capturedValues: {
        firstName: capturedData.firstName,
        lastName: capturedData.lastName,
        phone: capturedData.phone,
        email: capturedData.email,
        state: capturedData.state,
        zipCode: capturedData.zipCode,
        dateOfBirth: capturedData.dateOfBirth
      }
    });
  }

  // Try to get data from source page if it's still available
  if (sourcePage) {
    try {
      // Check if the page is still valid
      const isPageValid = await sourcePage.evaluate(() => {
        return document.readyState === 'complete' || document.readyState === 'interactive';
      }).catch(() => false);

      if (isPageValid) {
        console.log('🔍 Trying to capture from source page...');
    const formData = await sourcePage.evaluate(() => {
      return (window as any).capturedFormData || null;
    });

    if (formData) {
          console.log('✅ Form data captured from source page!');
      capturedData = formData;
      return NextResponse.json({ 
        success: true, 
        data: formData,
        message: 'Form data captured successfully',
        capturedValues: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          state: formData.state,
          zipCode: formData.zipCode,
          dateOfBirth: formData.dateOfBirth
        }
      });
        }
      }
    } catch (error) {
      console.log('⚠️ Source page is detached or unavailable:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // If we can't get data from the page, try to capture from current page
  console.log('🔍 Trying to capture form data from current page...');
  try {
    // Try to get data from any available page
    const pages = await browser?.pages() || [];
    for (const page of pages) {
      try {
        const formData = await page.evaluate(() => {
          return (window as any).capturedFormData || null;
        });
        
        if (formData) {
          console.log('✅ Form data captured from alternative page!');
          capturedData = formData;
      return NextResponse.json({ 
            success: true, 
            data: formData,
            message: 'Form data captured from alternative page',
            capturedValues: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              email: formData.email,
              state: formData.state,
              zipCode: formData.zipCode,
              dateOfBirth: formData.dateOfBirth
            }
          });
        }
      } catch (error) {
        // Continue to next page
        continue;
      }
    }
  } catch (error) {
    console.log('⚠️ Could not access browser pages:', error instanceof Error ? error.message : 'Unknown error');
  }

  // If we still can't get data, return error
  console.log('❌ No form data found and no pages available');
    return NextResponse.json({ 
      success: false, 
    message: 'No form data found. Please fill out and submit the form first.' 
  });
}

async function transferData() {
  if (!capturedData) {
    return NextResponse.json({ 
      success: false, 
      error: 'No captured data to transfer' 
    }, { status: 400 });
  }

  console.log('🔄 Transferring data to destination website...');
  console.log('📊 Data to transfer:', capturedData);
  
  // Validate zip code format
  if (!validateUSZipCode(capturedData.zipCode)) {
    console.log(`⚠️ Invalid US zip code format: ${capturedData.zipCode}`);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid US zip code format. Please use 5-digit format (e.g., 90001)' 
    }, { status: 400 });
  }
  
  // Get state from zip code for logging
  const stateFromZip = getStateFromZipCode(capturedData.zipCode);
  console.log(`🗺️ Zip code ${capturedData.zipCode} maps to state: ${stateFromZip}`);
  
  // Create location-based username for the target zip code
  const locationBasedUsername = createLocationBasedUsername(capturedData.zipCode);
  console.log(`🌍 Using location-based username: ${locationBasedUsername} for zip code: ${capturedData.zipCode}`);

  try {
    // Always create a new browser instance for destination to ensure clean proxy setup
    console.log('🌐 Launching new browser for destination with location-based IP...');
    if (browser) {
      console.log('🔄 Closing existing browser to ensure clean proxy setup...');
      await browser.close();
    }
    
    // Try with proxy first
    let useProxy = true;
    try {
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
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
          '--disable-setuid-sandbox',
          `--user-data-dir=/tmp/chrome_${Date.now()}_${capturedData.zipCode}` // Unique session
        ]
      });
      console.log('✅ Browser launched with proxy');
    } catch (proxyError) {
      console.log('⚠️ Failed to launch browser with proxy, trying without proxy...');
      useProxy = false;
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--allow-running-insecure-content',
          '--disable-extensions',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          `--user-data-dir=/tmp/chrome_${Date.now()}_${capturedData.zipCode}` // Unique session
        ]
      });
      console.log('✅ Browser launched without proxy (fallback)');
    }

    // Close existing target page if it exists
    if (targetPage) {
      console.log('🔄 Closing existing target page...');
      await targetPage.close();
    }

    // Open destination website (without #quote first)
    console.log('📄 Opening destination website...');
    targetPage = await browser.newPage();
    
    // Authenticate with proxy for target page using location-based username (only if using proxy)
    if (useProxy) {
      console.log('🔐 Authenticating with proxy for target page using location-based IP...');
      console.log(`🔐 Username: ${locationBasedUsername}`);
      console.log(`🔐 Password: ${PROXY_CONFIG.password}`);
      console.log(`🌐 Proxy: ${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`);
      
      // Set proxy authentication
      await targetPage.authenticate({
        username: locationBasedUsername,
        password: PROXY_CONFIG.password
      });
    } else {
      console.log('⚠️ Using browser without proxy - no location-based IP routing');
    }
    
    // DataImpulse will automatically route to the correct location-based IP
    console.log(`🌍 DataImpulse will route to US location for zip code: ${capturedData.zipCode}`);
    
    // Skip IP testing to avoid showing unwanted pages to user
    console.log('🌍 Proxy configured, proceeding to destination website...');
    
    // Set a longer timeout for page load with retry mechanism
    let pageLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!pageLoaded && retryCount < maxRetries) {
      try {
        console.log(`🌐 Attempting to load destination website (attempt ${retryCount + 1}/${maxRetries})...`);
    await targetPage.goto('https://finalexpensequote.us', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
        pageLoaded = true;
        console.log('✅ Destination website loaded successfully');
      } catch (error) {
        retryCount++;
        console.log(`⚠️ Failed to load destination website (attempt ${retryCount}):`, error instanceof Error ? error.message : 'Unknown error');
        
        if (retryCount < maxRetries) {
          console.log('🔄 Retrying in 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Try to re-authenticate with proxy (only if using proxy)
          if (useProxy) {
            try {
              await targetPage.authenticate({
                username: locationBasedUsername,
                password: PROXY_CONFIG.password
              });
              console.log('🔐 Re-authenticated with proxy');
            } catch (authError) {
              console.log('⚠️ Could not re-authenticate:', authError instanceof Error ? authError.message : 'Unknown error');
            }
          }
        } else {
          console.log('❌ All retry attempts failed, trying without proxy...');
          // Try without proxy as fallback
          try {
            await targetPage.goto('https://finalexpensequote.us', { 
              waitUntil: 'networkidle2',
              timeout: 30000 
            });
            pageLoaded = true;
            console.log('✅ Destination website loaded without proxy (fallback)');
          } catch (fallbackError) {
            console.log('❌ Even fallback failed:', fallbackError instanceof Error ? fallbackError.message : 'Unknown error');
            throw new Error(`Failed to load destination website after ${maxRetries} retries and fallback attempt`);
          }
        }
      }
    }

    console.log('✅ Destination website loaded');
    console.log('⏳ Waiting 3 seconds for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Skip IP verification to avoid showing unwanted pages to user
    console.log('🌍 Destination website loaded, proceeding with form filling...');
    
    // Scroll down slowly like a human would
    console.log('👤 Scrolling down like a human...');
    await targetPage.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Scroll down to find the form
    await targetPage.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Scroll down more to find the form
    await targetPage.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Scroll down to the form area
    await targetPage.evaluate(() => {
      window.scrollTo({ top: 1500, behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🤖 Starting to fill form...');

    // Fill the form
    await fillForm(capturedData);

    return NextResponse.json({ 
      success: true, 
      message: 'Data transferred successfully' 
    });

  } catch (error) {
    console.error('❌ Error transferring data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to transfer data' 
    }, { status: 500 });
  }
}

async function fillForm(formData: FormData) {
  if (!targetPage) return;

  console.log('📝 Filling form with captured data...');
  console.log('📊 Data to fill:', formData);

  try {
    // Wait for page to load completely
    await targetPage.waitForFunction(() => document.readyState === 'complete');
    
    // Wait for form to be present
    console.log('🔍 Waiting for form to be present...');
    await targetPage.waitForSelector('form', { timeout: 20000 });

    // Fill each field with better selectors and more reliable approach
    const fields = [
      { selectors: ['input[name="firstName"]', 'input[name="first_name"]', 'input[placeholder*="First"]', 'input[placeholder*="first"]'], value: formData.firstName, name: 'First Name' },
      { selectors: ['input[name="lastName"]', 'input[name="last_name"]', 'input[placeholder*="Last"]', 'input[placeholder*="last"]'], value: formData.lastName, name: 'Last Name' },
      { selectors: ['input[name="phone"]', 'input[name="phoneNumber"]', 'input[type="tel"]', 'input[placeholder*="phone"]', 'input[placeholder*="Phone"]'], value: formData.phone, name: 'Phone' },
      { selectors: ['input[name="email"]', 'input[type="email"]', 'input[placeholder*="email"]', 'input[placeholder*="Email"]'], value: formData.email, name: 'Email' },
      { selectors: ['input[name="state"]', 'select[name="state"]', 'input[placeholder*="state"]', 'input[placeholder*="State"]'], value: formData.state, name: 'State' },
      { selectors: ['input[name="zipCode"]', 'input[name="zip"]', 'input[name="zipcode"]', 'input[placeholder*="zip"]', 'input[placeholder*="Zip"]'], value: formData.zipCode, name: 'Zip Code' },
      { selectors: ['input[name="dateOfBirth"]', 'input[name="dob"]', 'input[name="birthDate"]', 'input[placeholder*="birth"]', 'input[placeholder*="Birth"]', 'input[placeholder*="Date"]', 'input[placeholder*="date"]', 'input[type="date"]', 'input[placeholder*="MM/DD/YYYY"]', 'input[placeholder*="mm/dd/yyyy"]', 'input[placeholder*="DOB"]', 'input[placeholder*="dob"]', 'input[placeholder*="Date of Birth"]', 'input[placeholder*="date of birth"]'], value: formData.dateOfBirth, name: 'Date of Birth' }
    ];

    for (const field of fields) {
      try {
        console.log(`🔍 Looking for ${field.name} field...`);
        let element = null;
        
        // Try each selector for this field
        for (const selector of field.selectors) {
          try {
            element = await targetPage.$(selector);
            if (element) {
              console.log(`✅ Found ${field.name} field with selector: ${selector}`);
              break;
            } else {
              console.log(`❌ ${field.name} field not found with selector: ${selector}`);
            }
          } catch (error) {
            console.log(`❌ Error with selector ${selector}:`, error instanceof Error ? error.message : 'Unknown error');
          }
        }
        
        if (element) {
          console.log(`✅ Filling ${field.name} with: ${field.value}`);
          
          // Human-like behavior: scroll to the field first
          await element.scrollIntoView();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Click on the field like a human would
          await element.click();
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Clear the field first
          await element.click({ clickCount: 3 });
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Special handling for date of birth field
          if (field.name === 'Date of Birth') {
            console.log(`📅 Writing date of birth: ${field.value}`);
            // Type the date with slashes as it was captured from first form
            await element.type(field.value, { delay: 200 });
            console.log(`✅ Date of Birth filled with format: ${field.value}`);
          } else {
            // Type with human-like delays
            await element.type(field.value, { delay: 150 });
          }
          
          console.log(`✅ ${field.name} filled successfully`);
          
          // Human-like pause between fields (1-3 seconds)
          const pauseTime = Math.random() * 2000 + 1000; // 1-3 seconds
          console.log(`⏳ Human-like pause: ${Math.round(pauseTime)}ms`);
          await new Promise(resolve => setTimeout(resolve, pauseTime));
          
        } else {
          console.log(`❌ ${field.name} field not found with any selector`);
          // For date of birth, let's try to find all input fields and log them
          if (field.name === 'Date of Birth') {
            console.log('🔍 Debugging: Looking for all input fields on the page...');
            const allInputs = await targetPage.$$('input');
            console.log(`Found ${allInputs.length} input fields on the page`);
            for (let i = 0; i < allInputs.length; i++) {
              const input = allInputs[i];
              const name = await input.evaluate(el => el.name);
              const placeholder = await input.evaluate(el => el.placeholder);
              const type = await input.evaluate(el => el.type);
              console.log(`Input ${i}: name="${name}", placeholder="${placeholder}", type="${type}"`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error filling ${field.name}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Wait a moment for all fields to be filled
    console.log('⏳ Waiting for fields to be filled...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Skip IP verification to avoid showing unwanted pages to user
    console.log('🌍 Proceeding with form submission using configured proxy...');

    // Human-like pause before submitting
    console.log('👤 Human-like pause before submitting...');
    const submitPause = Math.random() * 3000 + 2000; // 2-5 seconds
    console.log(`⏳ Human-like submit pause: ${Math.round(submitPause)}ms`);
    await new Promise(resolve => setTimeout(resolve, submitPause));

    // Look for and click the "Get Quote Now" button
    console.log('🔍 Looking for submit button...');
    
    // Try multiple button selectors
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button',
      'input[value*="Get Quote"]',
      'input[value*="Submit"]',
      'button:contains("Get Quote")',
      'button:contains("Submit")'
    ];
    
    let submitButton = null;
    for (const selector of buttonSelectors) {
      try {
        submitButton = await targetPage.$(selector);
        if (submitButton) {
          console.log(`✅ Found submit button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (submitButton) {
      console.log('✅ Clicking submit button...');
      await submitButton.click();
      console.log('✅ Form submitted successfully!');
    } else {
      // Try to submit the form directly
      console.log('🔍 Submit button not found, trying to submit form directly...');
      await targetPage.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          form.submit();
        }
      });
      console.log('✅ Form submitted via form.submit()');
    }

  } catch (error) {
    console.error('❌ Error filling form:', error);
  }
}

async function stopBot() {
  console.log('🛑 Stopping PuppeteerBot...');
  isBotActive = false;
  capturedData = null;

  if (browser) {
    await browser.close();
    browser = null;
  }

  sourcePage = null;
  targetPage = null;

  return NextResponse.json({ 
    success: true, 
    message: 'Bot stopped successfully' 
  });
}
