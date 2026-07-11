import { useEffect } from "react";
import { useAdminStore } from "../store/adminStore";

function Dashboard() {
  const { movies, lists, fetchMovies, fetchLists } = useAdminStore();

  useEffect(() => {
    fetchMovies();
    fetchLists();
  }, [fetchMovies, fetchLists]);

  const movieCount = movies.length;
  const seriesCount = movies.filter((m) => m.isSeries).length;
  const listCount = lists.length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Total Movies</h3>
          <p className="text-3xl font-bold text-white mt-2">{movieCount}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">TV Shows</h3>
          <p className="text-3xl font-bold text-white mt-2">{seriesCount}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Lists</h3>
          <p className="text-3xl font-bold text-white mt-2">{listCount}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
