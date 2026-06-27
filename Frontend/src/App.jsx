import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Books",
  "Home",
  "Sports",
  "Toys",
  "Food",
  "Beauty",
];

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const [cursorHistory, setCursorHistory] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);

  const pageCache = useRef({});

  function buildParams(cursor, cat) {
    const params = new URLSearchParams();

    if (cat) params.set("category", cat);

    if (cursor) {
      params.set("updated_at", cursor.updated_at);
      params.set("id", cursor.id);
    }

    return params.toString();
  }

  async function fetchProducts(cursor, cat, targetPage) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API}/products?${buildParams(cursor, cat)}`
      );

      const json = await res.json();

      if (!json.success) throw new Error();

      setProducts(json.data);
      setNextCursor(json.nextCursor);

      pageCache.current[targetPage] = {
        data: json.data,
        nextCursor: json.nextCursor,
      };
    } catch {
      setError("Could not reach the server.");
      setProducts([]);
    } finally {
      setLoading(false);
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

    const nextPage = page + 1;

    const history = [...cursorHistory];
    history[page] = nextCursor;

    setCursorHistory(history);
    setPage(nextPage);

    const cached = pageCache.current[nextPage];

    if (cached) {
      setProducts(cached.data);
      setNextCursor(cached.nextCursor);
      return;
    }

    fetchProducts(nextCursor, category, nextPage);
  }

  function handlePrev() {
    if (page <= 1 || loading) return;

    const prevPage = page - 1;

    setPage(prevPage);

    const cached = pageCache.current[prevPage];

    if (cached) {
      setProducts(cached.data);
      setNextCursor(cached.nextCursor);
      return;
    }

    fetchProducts(cursorHistory[prevPage - 1], category, prevPage);
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          marginBottom: "1.5rem",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "1rem",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
          Product Browser
        </h1>

        <p style={{ color: "#6b7280", fontSize: 13 }}>
          200,000 products — newest first.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #d1d5db",
          }}
        >
          <option value="">All Categories</option>

          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <button
          onClick={handleFilter}
          style={btnStyle("#111", "#fff")}
        >
          Filter
        </button>

        <button
          onClick={handleReset}
          style={btnStyle("#fff", "#111", "#d1d5db")}
        >
          Reset
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: 10,
            borderRadius: 6,
            marginBottom: 15,
          }}
        >
          {error}
        </div>
      )}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            {["ID", "Name", "Category", "Price", "Updated At"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: 10,
                  color: "#6b7280",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} style={centeredCell}>
                Loading...
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={5} style={centeredCell}>
                No Products Found
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr
                key={p.id}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <td style={{ padding: 10 }}>#{p.id}</td>

                <td style={{ padding: 10 }}>{p.name}</td>

                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      background: "#f3f4f6",
                      borderRadius: 20,
                      padding: "3px 8px",
                    }}
                  >
                    {p.category}
                  </span>
                </td>

                <td style={{ padding: 10 }}>
                  ${parseFloat(p.price).toFixed(2)}
                </td>

                <td style={{ padding: 10 }}>
                  {p.updated_at}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <span>Page {page}</span>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handlePrev}
            disabled={page === 1 || loading}
            style={btnStyle("#fff", "#111", "#d1d5db")}
          >
            ← Prev
          </button>

          <button
            onClick={handleNext}
            disabled={!nextCursor || loading}
            style={btnStyle("#fff", "#111", "#d1d5db")}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg, color, border = bg) {
  return {
    padding: "8px 14px",
    borderRadius: 6,
    border: `1px solid ${border}`,
    background: bg,
    color,
    cursor: "pointer",
  };
}

const centeredCell = {
  textAlign: "center",
  padding: "3rem",
  color: "#6b7280",
};