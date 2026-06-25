import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const CATEGORIES = ["Electronics", "Clothing", "Books", "Home", "Sports", "Toys", "Food", "Beauty"];

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState([null]); // index = page-1
  const [nextCursor, setNextCursor] = useState(null);

  async function fetchProducts(cursor, cat) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    if (cursor) {
      params.set("updated_at", cursor.updated_at);
      params.set("id", cursor.id);
    }

    try {
      const res = await fetch(`${API}/products?${params.toString()}`);
      const json = await res.json();

      if (!json.success) throw new Error("Server error");

      setProducts(json.data);
      setNextCursor(json.nextCursor);
    } catch (err) {
      setError("Could not reach the server. Make sure your backend is running.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchProducts(null, "");
  }, []);

  function handleFilter() {
    setPage(1);
    setCursorHistory([null]);
    setNextCursor(null);
    fetchProducts(null, category);
  }

  function handleReset() {
    setCategory("");
    setPage(1);
    setCursorHistory([null]);
    setNextCursor(null);
    fetchProducts(null, "");
  }

  function handleNext() {
    if (!nextCursor) return;
    const newHistory = [...cursorHistory];
    newHistory[page] = nextCursor; // save cursor for this page
    setCursorHistory(newHistory);
    setPage((p) => p + 1);
    fetchProducts(nextCursor, category);
  }

  function handlePrev() {
    if (page <= 1) return;
    const prevPage = page - 2;
    const cursor = cursorHistory[prevPage] || null;
    setPage((p) => p - 1);
    fetchProducts(cursor, category);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Product browser</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          200,000 products — newest first. Filter by category and paginate.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ flex: 1, padding: "6px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button onClick={handleFilter} style={btnStyle("#111", "#fff")}>Filter</button>
        <button onClick={handleReset} style={btnStyle("#fff", "#374151", "#d1d5db")}>Reset</button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 13, color: "#b91c1c", background: "#fef2f2", padding: "10px 12px", borderRadius: 6, marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            {["ID", "Name", "Category", "Price", "Updated at"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "0 10px 10px", fontWeight: 500, fontSize: 12, color: "#6b7280" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={centeredCell}>Loading...</td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan={5} style={centeredCell}>No products found</td></tr>
          ) : (
            products.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px", color: "#9ca3af" }}>#{p.id}</td>
                <td style={{ padding: "10px", fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f3f4f6", color: "#374151" }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>${parseFloat(p.price).toFixed(2)}</td>
                <td style={{ padding: "10px", color: "#9ca3af", fontSize: 12 }}>{p.updated_at}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Page {page}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handlePrev} disabled={page <= 1} style={btnStyle("#fff", "#374151", "#d1d5db")}>← Prev</button>
          <button onClick={handleNext} disabled={!nextCursor} style={btnStyle("#fff", "#374151", "#d1d5db")}>Next →</button>
        </div>
      </div>

    </div>
  );
}

function btnStyle(bg, color, border) {
  return {
    padding: "6px 14px",
    fontSize: 13,
    borderRadius: 6,
    border: `1px solid ${border || bg}`,
    background: bg,
    color: color,
    cursor: "pointer",
  };
}

const centeredCell = {
  textAlign: "center",
  padding: "3rem 0",
  color: "#9ca3af",
  fontSize: 14,
};