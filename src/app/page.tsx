'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isBotActive, setIsBotActive] = useState(false);
  const [botStatus, setBotStatus] = useState('');
  const [capturedData, setCapturedData] = useState<any>(null);

  useEffect(() => {
    // Check bot status periodically
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status' })
        });
        const data = await response.json();
        
        setIsBotActive(data.isActive);
        
        if (data.hasData && !botStatus.includes('transferred')) {
          setBotStatus('✅ Data transferred and submitted successfully!');
          setTimeout(() => {
            setBotStatus('');
          }, 5000);
        }
      } catch (error) {
        console.error('Error checking bot status:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [botStatus]);

  const startBot = async () => {
    setIsBotActive(true);
    setBotStatus('🤖 Bot is starting...');
    
    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBotStatus('👀 Bot is monitoring the first website. Please fill out the form and submit it.');
        
        // Set up a more aggressive polling mechanism to check for captured data
        const checkForData = setInterval(async () => {
          try {
            console.log('🔍 Checking for captured form data...');
            const captureResponse = await fetch('/api/bot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'capture' })
            });
            
            const captureData = await captureResponse.json();
            console.log('📊 Capture response:', captureData);
            
            if (captureData.success && captureData.data) {
              console.log('✅ Form data captured successfully!');
              setCapturedData(captureData.capturedValues);
              setBotStatus('📝 Form data captured! Opening second website...');
              
              // Clear the interval to prevent multiple transfers
              clearInterval(checkForData);
              
              // Wait a moment before transferring
              setTimeout(async () => {
                try {
                  const transferResponse = await fetch('/api/bot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'transfer' })
                  });
                  
                  const transferData = await transferResponse.json();
                  
                  if (transferData.success) {
                    setBotStatus('✅ Bot is filling the second form and will submit it automatically!');
                  } else {
                    setBotStatus('❌ Error transferring data');
                  }
                } catch (error) {
                  console.error('Transfer error:', error);
                  setBotStatus('❌ Error transferring data');
                }
              }, 2000);
            } else {
              console.log('⏳ No form data captured yet, continuing to monitor...');
            }
          } catch (error) {
            console.error('Error checking for data:', error);
          }
        }, 1000); // Check every 1 second instead of 3 seconds
        
      } else {
        setBotStatus('❌ Error starting bot');
        setIsBotActive(false);
      }
      
    } catch (error) {
      setBotStatus('❌ Error occurred');
      setIsBotActive(false);
    }
  };

  const stopBot = async () => {
    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      setIsBotActive(false);
      setBotStatus('');
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🤖</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FormBot</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Automated Form Transfer</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Smart Form
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Bot</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Automatically capture form data from one website and transfer it to another. 
              No manual work required - just let the bot do the magic!
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">👁️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Smart Monitoring</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Automatically detects when forms are filled and submitted on target websites.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Instant Transfer</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Captures form data and instantly fills the same information on the destination site.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Accurate Mapping</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Intelligently maps form fields between different websites for seamless data transfer.
              </p>
            </div>
          </div>

          {/* Bot Status */}
          {botStatus && (
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-medium text-gray-900 dark:text-white">{botStatus}</span>
                </div>
              </div>
            </div>
          )}

          {/* Captured Data Display */}
          {capturedData && (
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                  📊 Captured Form Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">First Name:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{capturedData.firstName || 'Not captured'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Last Name:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{capturedData.lastName || 'Not captured'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{capturedData.phone || 'Not captured'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{capturedData.email || 'Not captured'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">State:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{capturedData.state || 'Not captured'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Zip Code:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{capturedData.zipCode || 'Not captured'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Date of Birth:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{capturedData.dateOfBirth || 'Not captured'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bot Control Buttons */}
          <div className="mb-16 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={startBot}
              disabled={isBotActive}
              className={`px-12 py-4 rounded-xl text-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                isBotActive
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isBotActive ? '🤖 Bot is Running...' : '🚀 Start Form Bot'}
            </button>
            
            {isBotActive && (
              <button
                onClick={stopBot}
                className="px-8 py-4 rounded-xl text-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                🛑 Stop Bot
              </button>
            )}
            
            {/* Debug button for testing */}
            <button
              onClick={async () => {
                setBotStatus('🧪 Testing bot transfer...');
                
                try {
                  // Start bot first
                  await fetch('/api/bot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'start' })
                  });
                  
                  // Wait a moment then transfer
                  setTimeout(async () => {
                    const response = await fetch('/api/bot', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'transfer' })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      setBotStatus('✅ Test transfer completed!');
                    } else {
                      setBotStatus('❌ Test transfer failed');
                    }
                  }, 3000);
                  
                } catch (error) {
                  setBotStatus('❌ Test transfer error');
                  console.error('Test transfer error:', error);
                }
              }}
              className="px-8 py-4 rounded-xl text-xl font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              🧪 Test Transfer
            </button>
            
            {/* Manual capture button */}
            <button
              onClick={async () => {
                setBotStatus('🔍 Manually checking for form data...');
                
                try {
                  const response = await fetch('/api/bot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'capture' })
                  });
                  
                  const data = await response.json();
                  console.log('Manual capture response:', data);
                  
                  if (data.success && data.data) {
                    setCapturedData(data.capturedValues);
                    setBotStatus('✅ Form data captured manually!');
                  } else {
                    setBotStatus('❌ No form data found');
                  }
                } catch (error) {
                  setBotStatus('❌ Manual capture error');
                  console.error('Manual capture error:', error);
                }
              }}
              className="px-8 py-4 rounded-xl text-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              🔍 Manual Capture
            </button>
            
            {/* Manual transfer button */}
            <button
              onClick={async () => {
                setBotStatus('🔄 Manually transferring data...');
                
                try {
                  const response = await fetch('/api/bot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'transfer' })
                  });
                  
                  const data = await response.json();
                  console.log('Manual transfer response:', data);
                  
                  if (data.success) {
                    setBotStatus('✅ Data transferred manually! Bot is filling the second form...');
                  } else {
                    setBotStatus('❌ Manual transfer failed: ' + data.error);
                  }
                } catch (error) {
                  setBotStatus('❌ Manual transfer error');
                  console.error('Manual transfer error:', error);
                }
              }}
              className="px-8 py-4 rounded-xl text-xl font-semibold bg-purple-500 text-white hover:bg-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              🔄 Manual Transfer
            </button>
          </div>

          {/* How it Works */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Monitor</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Bot watches the source website for form submissions
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Capture</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Automatically captures all form data when submitted
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Transfer</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Fills and submits the same data on destination website
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>© 2025 FormBot. Automated form data transfer made simple.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
