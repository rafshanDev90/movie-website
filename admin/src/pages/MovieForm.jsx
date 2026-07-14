import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminStore, api } from "../store/adminStore";
import FileUpload from "../components/FileUpload";
import toast, { Toaster } from "react-hot-toast";

function MovieForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createMovie, updateMovie } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    year: "",
    duration: "",
    limit: "",
    isSeries: false,
    image: "",
    imageTitle: "",
    imageSmall: "",
    trailer: "",
    video: "",
  });

  useEffect(() => {
    if (id) {
      api.get(`/movies/${id}`).then((res) => {
        setForm(res.data.data);
      }).catch(() => {
        toast.error("Failed to load movie");
      });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (field) => (url) => {
    setForm((prev) => ({ ...prev, [field]: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = id ? await updateMovie(id, form) : await createMovie(form);
    setLoading(false);

    if (result.success) {
      toast.success(id ? "Movie updated" : "Movie created");
      navigate("/movies");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="max-w-2xl">
      <Toaster />
      <h2 className="text-2xl font-bold mb-6">{id ? "Edit Movie" : "Add Movie"}</h2>

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

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Genre</label>
            <input name="genre" value={form.genre} onChange={handleChange} className="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Year</label>
            <input name="year" value={form.year} onChange={handleChange} className="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Duration</label>
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 2h 30m" className="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Age Limit</label>
            <input name="limit" type="number" value={form.limit} onChange={handleChange} className="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              name="isSeries"
              checked={form.isSeries}
              onChange={handleChange}
              className="rounded"
            />
            This is a TV Series
          </label>
        </div>

        <h3 className="text-lg font-semibold mb-4 text-gray-300">Media Files</h3>

        <FileUpload label="Poster Image" accept="image/*" onChange={handleFileChange("image")} currentValue={form.image} />
        <FileUpload label="Title Image" accept="image/*" onChange={handleFileChange("imageTitle")} currentValue={form.imageTitle} />
        <FileUpload label="Thumbnail" accept="image/*" onChange={handleFileChange("imageSmall")} currentValue={form.imageSmall} />
        <FileUpload label="Trailer Video" accept="video/*" onChange={handleFileChange("trailer")} currentValue={form.trailer} />
        <FileUpload label="Full Video" accept="video/*" onChange={handleFileChange("video")} currentValue={form.video} />

        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading ? "Saving..." : id ? "Update" : "Create"}
          </button>
          <button type="button" onClick={() => navigate("/movies")} className="px-6 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default MovieForm;
