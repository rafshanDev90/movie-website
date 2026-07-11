import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function Watch() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/v1/movies/${id}`)
      .then((res) => {
        setMovie(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Movie not found</div>
      </div>
    );
  }

  const videoUrl = movie.video?.startsWith("http")
    ? movie.video
    : movie.video
    ? `${window.location.origin}${movie.video}`
    : null;

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 px-4 md:px-12 py-3 flex items-center justify-between">
        <Link to="/" className="text-red-600 font-bold text-xl">
          MOVIEFLIX
        </Link>
        <h2 className="text-sm md:text-base font-medium truncate ml-4">{movie.title}</h2>
      </div>

      <div className="pt-14">
        {videoUrl ? (
          <video
            key={videoUrl}
            className="w-full h-[60vh] md:h-[85vh] bg-black"
            controls
            autoPlay
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-[60vh] md:h-[85vh] bg-gray-900 flex items-center justify-center">
            <p className="text-gray-500">No video available</p>
          </div>
        )}
      </div>

      <div className="px-4 md:px-12 py-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl md:text-4xl font-bold">{movie.title}</h1>
            {movie.limit && (
              <span className="text-xs border border-gray-400 px-2 py-0.5">{movie.limit}+</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            {movie.year && <span>{movie.year}</span>}
            {movie.duration && <span>{movie.duration}</span>}
            {movie.genre && <span className="text-gray-300">{movie.genre}</span>}
            {movie.isSeries && <span className="bg-gray-700 px-2 py-0.5 rounded text-xs">Series</span>}
          </div>

          {movie.description && (
            <p className="text-gray-300 leading-relaxed mb-6">{movie.description}</p>
          )}

          {movie.video && (
            <a
              href={`/api/v1/download/${movie.video.split("/").pop()}`}
              className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 rounded font-semibold hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Watch;
