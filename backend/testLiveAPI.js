async function testLiveAPI() {
  const url = 'https://shopinfo-iw3x.onrender.com/api/auth/signup';
  try {
    const signupRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test Merchant",
        email: "testmerc123@example.com",
        password: "password123",
        shopName: "Test Shop",
        category: "Other",
        phone: "1234567890",
        address: "123 Test St",
        location: {
          type: "Point",
          coordinates: [75.8, 11.2]
        }
      })
    });
    
    if(!signupRes.ok) throw new Error(await signupRes.text());
    console.log("Signup success:", await signupRes.json());
    
    // Now login
    const loginRes = await fetch('https://shopinfo-iw3x.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "testmerc123@example.com",
        password: "password123"
      })
    });

    if(!loginRes.ok) throw new Error(await loginRes.text());
    const loginData = await loginRes.json();
    console.log("Login success, token:", loginData.token ? "YES" : "NO");
    
    // Now fetch shop
    const shopRes = await fetch('https://shopinfo-iw3x.onrender.com/api/shops/merchant/my', {
      headers: { 'Authorization': loginData.token }
    });
    if(!shopRes.ok) throw new Error(await shopRes.text());
    console.log("Shop fetched:", await shopRes.json());
  } catch(err) {
    console.error("TEST FAILED:", err.message);
  }
}

testLiveAPI();
