import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdminStore } from "../store/adminStore";
import toast from "react-hot-toast";

function Movies() {
  const { movies, fetchMovies, deleteMovie } = useAdminStore();

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this movie?")) return;
    const result = await deleteMovie(id);
    if (result.success) {
      toast.success("Movie deleted");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Movies</h2>
        <Link to="/movies/new" className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors">
          + Add Movie
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Title</th>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Genre</th>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Year</th>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Type</th>
              <th className="text-right px-4 py-3 text-sm text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie._id} className="border-t border-gray-700">
                <td className="px-4 py-3">{movie.title}</td>
                <td className="px-4 py-3 text-gray-400">{movie.genre}</td>
                <td className="px-4 py-3 text-gray-400">{movie.year}</td>
                <td className="px-4 py-3 text-gray-400">{movie.isSeries ? "Series" : "Movie"}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/movies/edit/${movie._id}`} className="text-blue-400 hover:underline mr-4">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(movie._id)} className="text-red-400 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No movies yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Movies;
