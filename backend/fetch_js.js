const https = require('https');
const fs = require('fs');

https.get('https://shopinfo-iw3x.onrender.com/static/js/main.fc91d02d.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    let out = "--- JS INVESTIGATION ---\n";
    
    let idx1 = data.indexOf('API_URL');
    if (idx1 !== -1) { out += "API_URL: " + data.substring(idx1 - 50, idx1 + 150) + "\n\n"; }

    let idx2 = data.indexOf('localhost');
    if (idx2 !== -1) { out += "localhost: " + data.substring(idx2 - 50, idx2 + 150) + "\n\n"; }

    let idx3 = data.indexOf('127.0.0.1');
    if (idx3 !== -1) { out += "127.0.0.1: " + data.substring(idx3 - 50, idx3 + 150) + "\n\n"; }

    fs.writeFileSync('js_output.txt', out);
    console.log("Done");
  });
});
