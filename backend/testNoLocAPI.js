async function testNoLocation() {
  const url = 'https://shopinfo-iw3x.onrender.com/api/auth/signup';
  try {
    const signupRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "NoLoc Merchant",
        email: "nolocmerch2@example.com",
        password: "password123",
        shopName: "No Location Shop",
        category: "Other",
        phone: "1234567890",
        address: "Nowhere"
      })
    });
    
    if(!signupRes.ok) throw new Error(await signupRes.text());
    console.log("Signup success without location:", await signupRes.json());
    
  } catch(err) {
    console.error("TEST FAILED:", err.message);
  }
}

testNoLocation();
