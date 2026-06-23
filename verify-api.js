// Simple API connection test

const testApiConnection = async () => {
  console.log('Testing API connection...');
  
  // Test the production API that should be available
  const testUrl = 'https://bin-iq-backend.vercel.app/api/health';
  
  try {
    const response = await fetch(testUrl);
    const data = await response.json();
    console.log('✅ API connection successful!');
    console.log('Response:', data);
    return true;
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
    return false;
  }
};

// Test if we're in browser environment
if (typeof window !== 'undefined') {
  console.log('Frontend environment detected');
  console.log('Current hostname:', window.location.hostname);
  
  if (window.location.hostname.includes('fly.dev') || window.location.hostname !== 'localhost') {
    console.log('Deployed environment - using production API');
  } else {
    console.log('Local environment - using local API');
  }
}

// Export for use
if (typeof module !== 'undefined') {
  module.exports = { testApiConnection };
}
