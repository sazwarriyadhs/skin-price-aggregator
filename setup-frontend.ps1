# ==========================================
# Skin Price Aggregator - Local Frontend Setup
# Location: C:\skin-price-aggregator
# ==========================================

$FRONTEND_DIR = "frontend"

Write-Host "📁 Creating frontend folder..." -ForegroundColor Cyan
mkdir $FRONTEND_DIR -Force
Set-Location $FRONTEND_DIR

Write-Host "⚛️ Creating React app (Vite)..." -ForegroundColor Cyan
npm create vite@latest . -- --template react

Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
npm install axios

Write-Host "🎨 Installing Tailwind CSS..." -ForegroundColor Cyan
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Tailwind config
@"
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"@ | Set-Content tailwind.config.js

# Tailwind CSS entry
@"
@tailwind base;
@tailwind components;
@tailwind utilities;
"@ | Set-Content src/index.css

# React App
@"
import { useState } from \"react\";
import axios from \"axios\";

export default function App() {
  const [query, setQuery] = useState(\"\");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        \`http://localhost:3000/api/prices?item=\${encodeURIComponent(query)}\`
      );
      setResult(res.data);
    } catch {
      setError(\"Failed to fetch prices\");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"min-h-screen bg-gray-100 p-6\">
      <div className=\"max-w-4xl mx-auto\">
        <h1 className=\"text-2xl font-bold mb-4\">Skin Price Aggregator</h1>

        <div className=\"flex gap-2 mb-6\">
          <input
            className=\"flex-1 p-2 border rounded\"
            placeholder=\"Search skin (e.g. AK-47 Redline)\"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={search}
            className=\"px-4 py-2 bg-black text-white rounded\"
          >
            Search
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className=\"text-red-500\">{error}</p>}

        {result && (
          <div className=\"bg-white shadow rounded p-4\">
            <h2 className=\"font-semibold mb-2\">Best Deal</h2>
            <p className=\"mb-4\">
              {result.bestDeal.marketplace} – {result.bestDeal.price} {result.bestDeal.currency}
            </p>

            <table className=\"w-full text-sm border\">
              <thead className=\"bg-gray-200\">
                <tr>
                  <th className=\"p-2 border\">Marketplace</th>
                  <th className=\"p-2 border\">Item</th>
                  <th className=\"p-2 border\">Price</th>
                  <th className=\"p-2 border\">Link</th>
                </tr>
              </thead>
              <tbody>
                {result.listings.map((l, i) => (
                  <tr key={i}>
                    <td className=\"p-2 border\">{l.marketplace}</td>
                    <td className=\"p-2 border\">{l.itemName}</td>
                    <td className=\"p-2 border\">{l.price} {l.currency}</td>
                    <td className=\"p-2 border\">
                      <a
                        href={l.url}
                        target=\"_blank\"
                        className=\"text-blue-600 underline\"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
"@ | Set-Content src/App.jsx

Write-Host "🧠 Opening VS Code..." -ForegroundColor Green
code .

Write-Host "✅ Frontend setup completed!" -ForegroundColor Green
Write-Host "▶️ Run frontend: cd frontend && npm run dev" -ForegroundColor Yellow
Write-Host "▶️ Run backend: npm run dev (from root)" -ForegroundColor Yellow
