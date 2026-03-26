const https = require('https');
https.get('https://shopinfo-iw3x.onrender.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const fs = require('fs');
    fs.writeFileSync('live_html.txt', data);
    console.log('Saved to live_html.txt');
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
