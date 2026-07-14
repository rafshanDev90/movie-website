import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminStore, api } from "../store/adminStore";
import toast, { Toaster } from "react-hot-toast";

function ListForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createList, updateList } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [allMovies, setAllMovies] = useState([]);
  const [form, setForm] = useState({
    title: "",
    type: "movie",
    genre: "",
    content: [],
  });

  useEffect(() => {
    api.get("/movies").then((res) => setAllMovies(res.data.data)).catch(() => {
      toast.error("Failed to load movies");
    });
    if (id) {
      api.get(`/lists/${id}`).then((res) => {
        const list = res.data.data;
        setForm({
          title: list.title,
          type: list.type || "movie",
          genre: list.genre || "",
          content: list.content?.map((m) => m._id) || [],
        });
      }).catch(() => {
        toast.error("Failed to load list");
      });
    }
  }, [id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMovieToggle = (movieId) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content.includes(movieId)
        ? prev.content.filter((id) => id !== movieId)
        : [...prev.content, movieId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = id ? await updateList(id, form) : await createList(form);
    setLoading(false);

    if (result.success) {
      toast.success(id ? "List updated" : "List created");
      navigate("/lists");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="max-w-2xl">
      <Toaster />
      <h2 className="text-2xl font-bold mb-6">{id ? "Edit List" : "Add List"}</h2>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg">
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600">
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Genre</label>
            <input name="genre" value={form.genre} onChange={handleChange} className="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Select Movies</label>
          <div className="bg-gray-700 rounded p-3 max-h-64 overflow-y-auto">
            {allMovies.map((movie) => (
              <label key={movie._id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-600 px-2 rounded">
                <input
                  type="checkbox"
                  checked={form.content.includes(movie._id)}
                  onChange={() => handleMovieToggle(movie._id)}
                  className="rounded"
                />
                <span className="text-sm">{movie.title}</span>
                <span className="text-xs text-gray-400 ml-auto">{movie.isSeries ? "Series" : "Movie"}</span>
              </label>
            ))}
            {allMovies.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No movies available</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading ? "Saving..." : id ? "Update" : "Create"}
          </button>
          <button type="button" onClick={() => navigate("/lists")} className="px-6 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ListForm;
