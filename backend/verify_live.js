// Check the live HTML from Render to see if my new button is even deployed.
const https = require('https');

https.get('https://shopinfo-iw3x.onrender.com/static/js/main.fc91d02d.js', (res) => { // the hash might have changed if rebuilt! We must fetch index.html first.
});
