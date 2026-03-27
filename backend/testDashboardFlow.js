// Try different possible passwords for the main account
async function testLogin(password) {
  const BASE = 'https://shopinfo-iw3x.onrender.com';
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'raeedahmadpc@gmail.com', password })
  });
  const text = await loginRes.text();
  console.log(`Password "${password}" => Status ${loginRes.status}: ${text}`);
  if (loginRes.ok) {
    const data = JSON.parse(text);
    // Now test the shop endpoint
    const shopRes = await fetch(`${BASE}/api/shops/merchant/my`, {
      headers: { 'Authorization': data.token }
    });
    console.log("  -> Shop status:", shopRes.status, await shopRes.text());
  }
}

async function run() {
  // The user likely changed their password since signup - we don't know it.
  // Instead let's just test the API with a known correct test account we created
  const BASE = 'https://shopinfo-iw3x.onrender.com';
  
  console.log("Testing with testmerc123@example.com / password123...");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testmerc123@example.com', password: 'password123' })
  });
  
  if (!loginRes.ok) {
    console.log("Test account login failed:", await loginRes.text());
    return;
  }
  
  const data = await loginRes.json();
  console.log("Login OK. Name:", data.name);
  
  console.log("\nFetching /api/shops/merchant/my...");
  const shopRes = await fetch(`${BASE}/api/shops/merchant/my`, {
    headers: { 'Authorization': data.token }
  });
  console.log("Status:", shopRes.status);
  console.log("Body:", await shopRes.text());
  
  console.log("\nFetching /api/auth/me...");
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { 'Authorization': data.token }
  });
  console.log("Status:", meRes.status);
  console.log("Body:", await meRes.text());
}

run().catch(err => console.error("Fatal:", err.message));
