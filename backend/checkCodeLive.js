const https = require('https');

https.get('https://shopinfo-iw3x.onrender.com/static/js/main.eb1375c2.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (data.includes('Force Reload Data')) {
        console.log("SUCCESS: NEW CODE IS DEPLOYED");
    } else {
        console.log("FAIL: OLD CODE IS STILL DEPLOYED");
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
