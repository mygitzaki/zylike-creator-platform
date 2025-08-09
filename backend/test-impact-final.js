const axios = require('axios');

const ACCOUNT_SID = 'IRRUahY7XJ5z3908029hfu7Hnt2GbJaaJ1';
const AUTH_TOKEN = 'YUspxEZGoABJLhvs3gsWTDs.ns-gv6XT';

console.log('🔍 Testing Real Impact.com API Connection...\n');
console.log(`Account SID: ${ACCOUNT_SID}`);
console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 10)}...\n`);

const headers = {
  'Authorization': `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

async function testAPI() {
  try {
    console.log('Testing basic MediaPartner endpoint...');
    const res = await axios.get(`https://api.impact.com/Mediapartners/${ACCOUNT_SID}`, {
      headers,
      timeout: 10000
    });
    
    console.log(`✅ Success: ${res.status}`);
    console.log(`Response type: ${typeof res.data}`);
    console.log(`Response keys: ${Object.keys(res.data).join(', ')}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status || 'Network error'}`);
    if (error.response?.data) {
      console.log(`Error details: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return false;
  }
}

testAPI().then(success => {
  if (success) {
    console.log('\n✅ Impact.com API is working with real data!');
    console.log('Your application can now use real Impact.com data.');
  } else {
    console.log('\n❌ Impact.com API connection failed.');
    console.log('The application will use mock data for testing.');
  }
});
