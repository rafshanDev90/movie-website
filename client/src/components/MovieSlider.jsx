import { useRef } from "react";
import MovieCard from "./MovieCard";

function MovieSlider({ title, movies }) {
  const sliderRef = useRef(null);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-8 px-4 md:px-12">
      <h2 className="text-lg md:text-xl font-semibold mb-3">{title}</h2>
      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-black/50 text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          &#8249;
        </button>
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-black/50 text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          &#8250;
        </button>
      </div>
    </div>
  );
}

export default MovieSlider;
