// Test script to verify chatbot always provides suggestions after replies
// Tests the updated system prompt implementation

const https = require('https');

const API_URL = 'https://autodevelop-v2-ph9pi5rag-kevins-projects-5e23f80d.vercel.app/api/chat';

// Test questions to verify suggestions are included
const testQuestions = [
  "How do I create a React component?",
  "What's the best way to learn JavaScript?",
  "How do I deploy a web app?",
  "What database should I use for my project?",
  "How do I add authentication to my app?"
];

async function testChatbotSuggestions() {
  console.log('🧪 Testing Chatbot Suggestions Feature');
  console.log('====================================\n');

  let passedTests = 0;
  let totalTests = testQuestions.length;

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`Test ${i + 1}/${totalTests}: "${question}"`);
    
    try {
      const response = await makeRequest(question);
      
      if (response && response.reply) {
        // Check if response includes suggestions
        const hasWhatNext = response.reply.includes("What's Next?") || response.reply.includes("What's next?");
        const hasSuggestedSteps = response.reply.includes("Suggested Next Steps") || response.reply.includes("suggested next steps");
        const hasRocketEmoji = response.reply.includes("🚀");
        const hasBulbEmoji = response.reply.includes("💡");
        
        if (hasWhatNext || hasSuggestedSteps || (hasRocketEmoji && (hasWhatNext || hasSuggestedSteps))) {
          console.log('✅ PASS - Response includes suggestions');
          passedTests++;
        } else {
          console.log('❌ FAIL - Response missing suggestions');
          console.log('Response snippet:', response.reply.slice(-200));
        }
      } else {
        console.log('❌ FAIL - No response received');
      }
    } catch (error) {
      console.log('❌ FAIL - Error:', error.message);
    }
    
    console.log('');
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Chatbot consistently provides suggestions.');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} tests failed. Review system prompt implementation.`);
  }
}

function makeRequest(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(API_URL, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Run the tests
testChatbotSuggestions().catch(console.error);
