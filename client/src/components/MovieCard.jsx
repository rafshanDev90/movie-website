import { Link } from "react-router-dom";

function MovieCard({ movie }) {
  return (
    <Link to={`/watch/${movie._id}`} className="group relative flex-shrink-0 w-40 md:w-52 cursor-pointer">
      <div className="overflow-hidden rounded-md">
        <img
          src={movie.image || movie.imageSmall || "https://via.placeholder.com/300x450?text=No+Image"}
          alt={movie.title}
          className="w-full h-56 md:h-72 object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium truncate">{movie.title}</h3>
        <p className="text-xs text-gray-400">{movie.year || ""}</p>
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-white/90 rounded-full p-3">
          <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
