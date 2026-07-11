import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import MovieCard from "../components/MovieCard";

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      axios
        .get(`/api/v1/movies/search/${encodeURIComponent(query)}`)
        .then((res) => {
          setResults(res.data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [query]);

  return (
    <div className="pt-20 px-4 md:px-12 min-h-screen">
      <h2 className="text-xl md:text-2xl font-bold mb-6">
        {query ? `Results for "${query}"` : "Search"}
      </h2>

      {loading ? (
        <div className="text-gray-400">Searching...</div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      ) : query ? (
        <div className="text-gray-500">No results found</div>
      ) : (
        <div className="text-gray-500">Type something to search</div>
      )}
    </div>
  );
}

export default Search;
