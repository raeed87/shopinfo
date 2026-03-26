import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

function ManageProducts() {
  const { shopId } = useParams();
  const [products, setProducts] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get(`http://localhost:5001/api/products/${shopId}`);
    setProducts(res.data);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await axios.delete(`http://localhost:5001/api/products/${id}`, {
      headers: { Authorization: token },
    });
    setProducts(products.filter(p => p._id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Products</h2>
        <Link to={`/add-product/${shopId}`}>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            + Add Product
          </button>
        </Link>
      </div>

      {products.length === 0 && (
        <p className="text-gray-500">No products yet. Add your first product!</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product._id} className="border rounded-xl shadow overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-3">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-green-600 font-bold">₹{product.price}</p>
              <button
                className="mt-2 text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 w-full"
                onClick={() => deleteProduct(product._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageProducts;
