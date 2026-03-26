import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5001" : "");

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/signup`, form);
      alert("Account created! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data || "Signup failed");
    }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handleSignup(); }} className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Merchant Signup</h2>
      <input className="border p-2 w-full mb-2 rounded" placeholder="Name"
        onChange={e => setForm({ ...form, name: e.target.value })} />
      <input className="border p-2 w-full mb-2 rounded" placeholder="Email"
        onChange={e => setForm({ ...form, email: e.target.value })} />
      <input className="border p-2 w-full mb-4 rounded" placeholder="Password" type="password"
        onChange={e => setForm({ ...form, password: e.target.value })} />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600">
        Create Account
      </button>
      <p className="mt-3 text-center text-sm">Already have an account? <Link to="/login" className="text-blue-500">Login</Link></p>
    </form>
  );
}

export default Signup;
