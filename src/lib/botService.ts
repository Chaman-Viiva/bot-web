// Bot Service for Form Data Transfer
export interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
}

export class FormBot {
  private isActive: boolean = false;
  private sourceUrl: string = 'http://finalexpensequote.us/opt_in';
  private targetUrl: string = 'https://finalexpensequote.us/#quote';
  private capturedData: FormData | null = null;

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener() {
    // Only add listener if we're in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.data.type === 'FORM_DATA_CAPTURED') {
          console.log('Form data captured:', event.data.formData);
          this.capturedData = event.data.formData;
          // Immediately transfer data
          setTimeout(() => {
            this.transferData();
          }, 1000);
        }
      });
    }
  }

  public async startBot(): Promise<void> {
    console.log('🤖 BOT ACTIVATED - Starting FormBot...');
    this.isActive = true;
    
    // Only run in browser environment
    if (typeof window === 'undefined') {
      console.log('❌ Window object not available - running in server environment');
      return;
    }
    
    console.log('🌐 Opening source website:', this.sourceUrl);
    // Open source website
    const sourceWindow = window.open(this.sourceUrl, '_blank');
    
    if (sourceWindow) {
      console.log('✅ Source website opened successfully');
      // Inject monitoring script into the source window
      this.injectMonitoringScript(sourceWindow);
    } else {
      console.log('❌ Failed to open source website - popup blocked?');
    }
  }

  private injectMonitoringScript(targetWindow: Window) {
    console.log('📝 Injecting monitoring script into source website...');
    const script = `
      (function() {
        console.log('🔍 MONITORING SCRIPT INJECTED - Waiting for form...');
        
        // Add monitoring indicator
        const monitorIndicator = document.createElement('div');
        monitorIndicator.innerHTML = '👁️ BOT MONITORING FORM...';
        monitorIndicator.style.cssText = \`
          position: fixed;
          top: 20px;
          left: 20px;
          background: #F59E0B;
          color: white;
          padding: 15px 20px;
          border-radius: 10px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: pulse 1s infinite;
        \`;
        document.body.appendChild(monitorIndicator);
        
        // Wait for page to load
        function waitForForm() {
          console.log('🔍 Looking for form on page...');
          const form = document.querySelector('form');
          if (form) {
            console.log('✅ FORM FOUND! Setting up submit listener...');
            form.addEventListener('submit', function(e) {
              console.log('🚨 FORM SUBMIT DETECTED! Capturing data...');
              e.preventDefault();
              
              // Show capture indicator
              monitorIndicator.innerHTML = '📝 CAPTURING FORM DATA...';
              monitorIndicator.style.background = '#4F46E5';
              
              // Capture form data with detailed logging
              console.log('🔍 CAPTURING INDIVIDUAL FIELD VALUES:');
              
              // First Name
              const firstNameSelector = 'input[name="firstName"], input[name="first_name"], input[placeholder*="First"]';
              const firstNameElement = document.querySelector(firstNameSelector);
              const firstName = firstNameElement?.value || '';
              console.log('👤 First Name Selector:', firstNameSelector);
              console.log('👤 First Name Element Found:', !!firstNameElement);
              console.log('👤 First Name Value:', firstName);
              
              // Last Name
              const lastNameSelector = 'input[name="lastName"], input[name="last_name"], input[placeholder*="Last"]';
              const lastNameElement = document.querySelector(lastNameSelector);
              const lastName = lastNameElement?.value || '';
              console.log('👤 Last Name Selector:', lastNameSelector);
              console.log('👤 Last Name Element Found:', !!lastNameElement);
              console.log('👤 Last Name Value:', lastName);
              
              // Phone
              const phoneSelector = 'input[name="phone"], input[name="phoneNumber"], input[type="tel"]';
              const phoneElement = document.querySelector(phoneSelector);
              const phone = phoneElement?.value || '';
              console.log('📞 Phone Selector:', phoneSelector);
              console.log('📞 Phone Element Found:', !!phoneElement);
              console.log('📞 Phone Value:', phone);
              
              // Email
              const emailSelector = 'input[name="email"], input[type="email"]';
              const emailElement = document.querySelector(emailSelector);
              const email = emailElement?.value || '';
              console.log('📧 Email Selector:', emailSelector);
              console.log('📧 Email Element Found:', !!emailElement);
              console.log('📧 Email Value:', email);
              
              // State
              const stateSelector = 'input[name="state"], select[name="state"]';
              const stateElement = document.querySelector(stateSelector);
              const state = stateElement?.value || '';
              console.log('🗺️ State Selector:', stateSelector);
              console.log('🗺️ State Element Found:', !!stateElement);
              console.log('🗺️ State Value:', state);
              
              // Zip Code
              const zipCodeSelector = 'input[name="zipCode"], input[name="zip"], input[name="zipcode"]';
              const zipCodeElement = document.querySelector(zipCodeSelector);
              const zipCode = zipCodeElement?.value || '';
              console.log('📮 Zip Code Selector:', zipCodeSelector);
              console.log('📮 Zip Code Element Found:', !!zipCodeElement);
              console.log('📮 Zip Code Value:', zipCode);
              
              // Date of Birth
              const dateOfBirthSelector = 'input[name="dateOfBirth"], input[name="dob"], input[name="birthDate"]';
              const dateOfBirthElement = document.querySelector(dateOfBirthSelector);
              const dateOfBirth = dateOfBirthElement?.value || '';
              console.log('🎂 Date of Birth Selector:', dateOfBirthSelector);
              console.log('🎂 Date of Birth Element Found:', !!dateOfBirthElement);
              console.log('🎂 Date of Birth Value:', dateOfBirth);
              
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
              console.log('📤 Sending data to parent window...');
              
              // Show data captured
              monitorIndicator.innerHTML = '✅ DATA CAPTURED! TRANSFERRING...';
              monitorIndicator.style.background = '#10B981';
              
              // Send data to parent window
              window.opener.postMessage({
                type: 'FORM_DATA_CAPTURED',
                formData: formData
              }, '*');
              
              console.log('✅ Data sent to parent window');
              
              // Submit the original form after a short delay
              setTimeout(() => {
                console.log('📤 Submitting original form...');
                form.submit();
              }, 1000);
            });
          } else {
            console.log('⏳ Form not found, retrying in 1 second...');
            setTimeout(waitForForm, 1000);
          }
        }
        
        if (document.readyState === 'loading') {
          console.log('⏳ Page still loading, waiting for DOMContentLoaded...');
          document.addEventListener('DOMContentLoaded', waitForForm);
        } else {
          console.log('✅ Page already loaded, starting form search...');
          waitForForm();
        }
      })();
    `;
    
    try {
      // Use a more compatible approach
      const scriptElement = targetWindow.document.createElement('script');
      scriptElement.textContent = script;
      targetWindow.document.head.appendChild(scriptElement);
      console.log('✅ Monitoring script injected successfully');
    } catch (error) {
      console.error('❌ Failed to inject monitoring script:', error);
    }
  }

  public async transferData(): Promise<void> {
    if (!this.capturedData) {
      console.log('❌ No captured data to transfer');
      return;
    }

    console.log('🔄 TRANSFERRING DATA TO DESTINATION WEBSITE');
    console.log('📊 Data being transferred:', this.capturedData);
    console.log('🌐 Opening destination website:', this.targetUrl);
    
    // Open target website in same window to make it visible
    const targetWindow = window.open(this.targetUrl, '_blank');
    
    if (targetWindow) {
      console.log('✅ Destination website opened successfully');
      console.log('⏳ Waiting 2 seconds for page to load, then injecting auto-fill script...');
      // Wait for page to load and inject auto-fill script
      setTimeout(() => {
        console.log('🤖 Injecting auto-fill script into destination website...');
        this.injectAutoFillScript(targetWindow, this.capturedData!);
      }, 2000);
    } else {
      console.error('❌ Failed to open destination website - popup blocked?');
    }
  }

  private injectAutoFillScript(targetWindow: Window, formData: FormData) {
    console.log('📝 Creating auto-fill script with data:', formData);
    const script = `
      (function() {
        console.log('🤖 AUTO-FILL SCRIPT INJECTED - Starting form filling...');
        console.log('📊 Data to fill:', ${JSON.stringify(formData)});
        
        // Add visual indicator that bot is working
        const botIndicator = document.createElement('div');
        botIndicator.innerHTML = '🤖 BOT IS FILLING FORM...';
        botIndicator.style.cssText = \`
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4F46E5;
          color: white;
          padding: 15px 20px;
          border-radius: 10px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: pulse 1s infinite;
        \`;
        document.body.appendChild(botIndicator);
        
        // Add CSS for animation
        const style = document.createElement('style');
        style.textContent = \`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .bot-highlight {
            background-color: #FEF3C7 !important;
            border: 2px solid #F59E0B !important;
            animation: highlight 0.5s ease-in-out;
          }
          @keyframes highlight {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        \`;
        document.head.appendChild(style);
        
        function autoFillForm() {
          console.log('🔍 Looking for form on destination website...');
          const form = document.querySelector('form');
          if (form) {
            console.log('✅ FORM FOUND on destination website! Starting to fill...');
            const fields = [
              { selector: 'input[name="firstName"], input[name="first_name"], input[placeholder*="First"]', value: '${formData.firstName}', name: 'First Name' },
              { selector: 'input[name="lastName"], input[name="last_name"], input[placeholder*="Last"]', value: '${formData.lastName}', name: 'Last Name' },
              { selector: 'input[name="phone"], input[name="phoneNumber"], input[type="tel"]', value: '${formData.phone}', name: 'Phone' },
              { selector: 'input[name="email"], input[type="email"]', value: '${formData.email}', name: 'Email' },
              { selector: 'input[name="state"], select[name="state"]', value: '${formData.state}', name: 'State' },
              { selector: 'input[name="zipCode"], input[name="zip"], input[name="zipcode"]', value: '${formData.zipCode}', name: 'Zip Code' },
              { selector: 'input[name="dateOfBirth"], input[name="dob"], input[name="birthDate"]', value: '${formData.dateOfBirth}', name: 'Date of Birth' }
            ];
            
            console.log('📝 Fields to fill:', fields.length);
            let filledCount = 0;
            
            fields.forEach((field, index) => {
              setTimeout(() => {
                console.log(\`🔍 Looking for \${field.name} field with selector: \${field.selector}\`);
                const element = document.querySelector(field.selector);
                if (element) {
                  console.log(\`✅ Found \${field.name} field, filling with: \${field.value}\`);
                  // Highlight the field being filled
                  element.classList.add('bot-highlight');
                  element.value = field.value;
                  
                  // Trigger events
                  element.dispatchEvent(new Event('input', { bubbles: true }));
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  
                  // Update bot indicator
                  botIndicator.innerHTML = \`🤖 FILLING \${field.name}... (\${filledCount + 1}/\${fields.length})\`;
                  
                  // Remove highlight after animation
                  setTimeout(() => {
                    element.classList.remove('bot-highlight');
                  }, 1000);
                  
                  filledCount++;
                  console.log(\`✅ \${field.name} filled successfully (\${filledCount}/\${fields.length})\`);
                  
                  if (filledCount === fields.length) {
                    console.log('🎉 ALL FIELDS FILLED! Preparing to submit...');
                    botIndicator.innerHTML = '✅ FORM FILLED! SUBMITTING...';
                    botIndicator.style.background = '#10B981';
                    
                    // Auto-submit after showing completion
                    setTimeout(() => {
                      if (form) {
                        console.log('🚀 SUBMITTING FORM...');
                        form.submit();
                        botIndicator.innerHTML = '🚀 FORM SUBMITTED!';
                        botIndicator.style.background = '#059669';
                        console.log('✅ FORM SUBMITTED SUCCESSFULLY!');
                      }
                    }, 2000);
                  }
                } else {
                  console.log(\`❌ \${field.name} field not found with selector: \${field.selector}\`);
                }
              }, index * 500); // Stagger the filling for visual effect
            });
          } else {
            console.log('⏳ Form not found on destination website, retrying in 1 second...');
            setTimeout(autoFillForm, 1000);
          }
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', autoFillForm);
        } else {
          autoFillForm();
        }
      })();
    `;
    
    try {
      // Use a more compatible approach
      const scriptElement = targetWindow.document.createElement('script');
      scriptElement.textContent = script;
      targetWindow.document.head.appendChild(scriptElement);
      console.log('✅ Auto-fill script injected successfully into destination website');
    } catch (error) {
      console.error('❌ Failed to inject auto-fill script:', error);
    }
  }

  public stopBot(): void {
    this.isActive = false;
    this.capturedData = null;
  }

  public getStatus(): { isActive: boolean; hasData: boolean } {
    return {
      isActive: this.isActive,
      hasData: this.capturedData !== null
    };
  }
}

// Export singleton instance
export const formBot = new FormBot();
