import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import MovieSlider from "../components/MovieSlider";
import TelegramBanner from "../components/TelegramBanner";

function Home() {
  const [featured, setFeatured] = useState(null);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [lists, setLists] = useState([]);

  useEffect(() => {
    axios.get("/api/v1/movies/random").then((res) => setFeatured(res.data.data));
    axios.get("/api/v1/movies?type=movie").then((res) => setMovies(res.data.data));
    axios.get("/api/v1/movies?type=series").then((res) => setSeries(res.data.data));
    axios.get("/api/v1/lists").then((res) => setLists(res.data.data));
  }, []);

  return (
    <div className="pt-16">
      {featured && (
        <div className="relative h-[70vh] min-h-[400px]">
          <img
            src={featured.image || "https://via.placeholder.com/1920x1080?text=No+Image"}
            alt={featured.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
          <div className="absolute bottom-20 left-4 md:left-12 max-w-xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">{featured.title}</h1>
            <p className="text-sm md:text-base text-gray-300 mb-4 line-clamp-3">
              {featured.description}
            </p>
            <div className="flex gap-3">
              <Link
                to={`/watch/${featured._id}`}
                className="px-6 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </Link>
              <div className="px-4 py-2 bg-gray-600/70 rounded flex items-center gap-2">
                <span className="text-sm">{featured.genre}</span>
                {featured.limit && <span className="text-xs border border-gray-400 px-1">{featured.limit}+</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <TelegramBanner />

      <div className="py-6 space-y-2">
        <MovieSlider title="Movies" movies={movies} />
        <MovieSlider title="TV Shows" movies={series} />
        {lists.map((list) => (
          <MovieSlider key={list._id} title={list.title} movies={list.content} />
        ))}
      </div>
    </div>
  );
}

export default Home;
