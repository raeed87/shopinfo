async function test() {
  try {
    const email = `test${Date.now()}@example.com`;
    // Signup
    const res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Merchant',
        email: email,
        password: 'password123',
        shopName: 'Test Unified Shop',
        category: 'Electronics',
        phone: '9998887776',
        address: '123 Tech Ave'
      })
    });
    console.log("Signup status:", res.status);
    const signupData = await res.json();
    console.log("Signup response:", signupData);

    // Login
    const loginReq = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'password123'
      })
    });
    const loginData = await loginReq.json();
    const token = loginData.token;
    console.log("Login success, token received");

    // Check shop (should be created simultaneously)
    const check1 = await fetch('http://localhost:5000/api/shops/merchant/my', {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    const shopData = await check1.json();
    console.log("Fetched Shop Name:", shopData ? shopData.name : null);
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
