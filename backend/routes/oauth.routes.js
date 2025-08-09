const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// OAuth callback endpoints for different platforms
router.get('/callback/:platform', verifyToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state } = req.query;
    const creatorId = req.creator.id;

    // For now, we'll simulate OAuth success
    // In production, you would:
    // 1. Exchange the authorization code for an access token
    // 2. Fetch user profile data from the platform
    // 3. Store the connection in the database

    console.log(`OAuth callback for ${platform}:`, { code, state, creatorId });

    // Return a simple HTML page that posts a message to the parent window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Success</title>
        </head>
        <body>
          <script>
            // Post message to parent window (the popup opener)
            window.opener.postMessage({
              type: 'oauth_success',
              platform: '${platform}',
              success: true
            }, 'http://localhost:5173');
            
            // Close the popup
            window.close();
          </script>
          <div style="text-align: center; font-family: Arial, sans-serif; padding: 50px;">
            <h2>✅ Connected Successfully!</h2>
            <p>You can close this window.</p>
          </div>
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Error</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'oauth_error',
              platform: '${req.params.platform}',
              error: 'Connection failed'
            }, 'http://localhost:5173');
            window.close();
          </script>
          <div style="text-align: center; font-family: Arial, sans-serif; padding: 50px;">
            <h2>❌ Connection Failed</h2>
            <p>Please try again or enter your username manually.</p>
          </div>
        </body>
      </html>
    `;

    res.send(errorHtml);
  }
});

// Get OAuth URL for a platform
router.get('/url/:platform', verifyToken, (req, res) => {
  try {
    const { platform } = req.params;
    const creatorId = req.creator.id;

    // Real OAuth URLs for each platform - using environment variables
    // Add your real client IDs to .env file to enable OAuth
    const oauthUrls = {
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID || 'demo_instagram_id'}&redirect_uri=http://localhost:5000/api/oauth/callback/instagram&scope=user_profile,user_media&response_type=code&state=${creatorId}`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY || 'demo_tiktok_key'}&response_type=code&scope=user.info.basic&redirect_uri=http://localhost:5000/api/oauth/callback/tiktok&state=${creatorId}`,
      twitter: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID || 'demo_twitter_id'}&redirect_uri=http://localhost:5000/api/oauth/callback/twitter&scope=tweet.read%20users.read&state=${creatorId}`,
      youtube: `https://accounts.google.com/oauth2/authorize?client_id=${process.env.GOOGLE_CLIENT_ID || 'demo_google_id'}&redirect_uri=http://localhost:5000/api/oauth/callback/youtube&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&state=${creatorId}`,
      facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID || 'demo_facebook_id'}&redirect_uri=http://localhost:5000/api/oauth/callback/facebook&scope=pages_read_engagement,pages_show_list&response_type=code&state=${creatorId}`
    };

    const url = oauthUrls[platform];
    if (!url) {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    res.json({ url, platform });
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
});

module.exports = router;
