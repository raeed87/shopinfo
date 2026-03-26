const https = require('https');

https.get('https://shopinfo-iw3x.onrender.com/static/js/main.fc91d02d.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Let's find "REACT_APP_API_URL" or "api/shops" and see the preceding characters.
    let idx = data.indexOf('api/shops');
    while(idx !== -1) {
      console.log('SURROUNDING api/shops:', data.substring(idx - 60, idx + 40));
      idx = data.indexOf('api/shops', idx + 1);
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
