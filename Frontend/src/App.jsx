import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const CATEGORIES = ["Electronics", "Clothing", "Books", "Home", "Sports", "Toys", "Food", "Beauty"];

export default function App() {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [category, setCategory]       = useState("");
  const [page, setPage]               = useState(1);
  const [cursorHistory, setCursorHistory] = useState([null]);
  const [nextCursor, setNextCursor]   = useState(null);

  // useRef instead of useState — no re-renders, no memory bloata
  const pageCache    = useRef({});   // pageNum → { data, nextCursor }
  const prefetchRef  = useRef(null); // in-flight prefetch AbortController
  const isPrefetched = useRef(false);


  function buildParams(cursor, cat) {
    const params = new URLSearchParams();
    if (cat)    params.set("category",   cat);
    if (cursor) params.set("updated_at", cursor.updated_at);
    if (cursor) params.set("id",         cursor.id);
    return params;
  }

  function applyPage(data, nextCur, pageNum) {
    setProducts(data);
    setNextCursor(nextCur);
    pageCache.current[pageNum] = { data, nextCursor: nextCur };
    isPrefetched.current = false;
  }

  async function fetchProducts(cursor, cat, targetPage) {
    // Cancel any in-flight prefetch so they don't race
    prefetchRef.current?.abort();
    prefetchRef.current = null;
    isPrefetched.current = false;

    setLoading(true);
    setError(null);

    try {
      const res  = await fetch(`${API}/products?${buildParams(cursor, cat)}`);
      const json = await res.json();
      if (!json.success) throw new Error("Server error");
      applyPage(json.data, json.nextCursor, targetPage);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Could not reach the server. Make sure your backend is running.");
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }


  async function handlePrefetchNext() {
    const nextPage = page + 1;
    // Already cached or prefetch in-flight → skip
    if (!nextCursor || loading || pageCache.current[nextPage] || prefetchRef.current) return;

    const controller = new AbortController();
    prefetchRef.current = controller;

    try {
      const res  = await fetch(
        `${API}/products?${buildParams(nextCursor, category)}`,
        { signal: controller.signal }
      );
      const json = await res.json();
      if (json.success) {
        pageCache.current[nextPage] = { data: json.data, nextCursor: json.nextCursor };
        isPrefetched.current = true;
      }
    } catch (err) {
      // Silent — click will fallback to normal fetch
    } finally {
      prefetchRef.current = null;
    }
  }

  useEffect(() => {
    fetchProducts(null, "", 1);
  }, []);


  function handleFilter() {
    pageCache.current = {};
    setPage(1);
    setCursorHistory([null]);
    setNextCursor(null);
    fetchProducts(null, category, 1);
  }

  function handleReset() {
    pageCache.current = {};
    setCategory("");
    setPage(1);
    setCursorHistory([null]);
    setNextCursor(null);
    fetchProducts(null, "", 1);
  }

  function handleNext() {
    if (!nextCursor || loading) return; 

    const nextPageNum = page + 1;
    const newHistory  = [...cursorHistory];
    newHistory[page]  = nextCursor;
    setCursorHistory(newHistory);
    setPage(nextPageNum);

    const cached = pageCache.current[nextPageNum];
    if (cached) {
      // Instant — prefetch already warmed the cache (or we visited before)
      setProducts(cached.data);
      setNextCursor(cached.nextCursor);
      isPrefetched.current = false;
    } else {
      // Prefetch didn't finish in time → normal fetch with loader
      fetchProducts(nextCursor, category, nextPageNum);
    }
  }

  function handlePrev() {
    if (page <= 1 || loading) return;

    const prevPageNum = page - 1;
    setPage(prevPageNum);

    const cached = pageCache.current[prevPageNum];
    if (cached) {
      setProducts(cached.data);
      setNextCursor(cached.nextCursor);
    } else {
      fetchProducts(cursorHistory[prevPageNum - 1] || null, category, prevPageNum);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>

      <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Product browser</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          200,000 products — newest first. Filter by category and paginate.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ flex: 1, padding: "6px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d5db" }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handleFilter} style={btnStyle("#111", "#fff")}>Filter</button>
        <button onClick={handleReset}  style={btnStyle("#fff", "#374151", "#d1d5db")}>Reset</button>
      </div>

      {error && (
        <div style={{ fontSize: 13, color: "#b91c1c", background: "#fef2f2", padding: "10px 12px", borderRadius: 6, marginBottom: "1rem" }}>
          {error}
        </div>
      )}

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Page {page}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handlePrev}
            disabled={page <= 1 || loading}
            style={btnStyle("#fff", "#374151", "#d1d5db")}
          >
            ← Prev
          </button>
          <button
            onClick={handleNext}
            onMouseEnter={handlePrefetchNext}
            disabled={!nextCursor || loading}      
            style={btnStyle("#fff", "#374151", "#d1d5db")}
          >
            Next →
          </button>
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