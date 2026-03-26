import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("merchantName", res.data.name);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data || "Login failed");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Merchant Login</h2>
      <input className="border p-2 w-full mb-2 rounded" placeholder="Email"
        onChange={e => setForm({ ...form, email: e.target.value })} />
      <input className="border p-2 w-full mb-4 rounded" placeholder="Password" type="password"
        onChange={e => setForm({ ...form, password: e.target.value })} />
      <button className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600"
        onClick={handleLogin}>Login</button>
      <p className="mt-3 text-center text-sm">No account? <Link to="/signup" className="text-blue-500">Sign up</Link></p>
    </div>
  );
}

export default Login;
