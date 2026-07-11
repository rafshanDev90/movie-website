import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent px-4 md:px-12 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-red-600 font-bold text-2xl tracking-wider">
          MOVIEFLIX
        </Link>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies..."
            className="px-3 py-1.5 bg-black/60 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-600 w-48 md:w-64"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-red-600 rounded text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>
    </nav>
  );
}

export default Navbar;
