import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdminStore } from "../store/adminStore";
import toast from "react-hot-toast";

function Lists() {
  const { lists, fetchLists, deleteList } = useAdminStore();

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this list?")) return;
    const result = await deleteList(id);
    if (result.success) {
      toast.success("List deleted");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Lists</h2>
        <Link to="/lists/new" className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors">
          + Add List
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Title</th>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Type</th>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Genre</th>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Items</th>
              <th className="text-right px-4 py-3 text-sm text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lists.map((list) => (
              <tr key={list._id} className="border-t border-gray-700">
                <td className="px-4 py-3">{list.title}</td>
                <td className="px-4 py-3 text-gray-400">{list.type || "-"}</td>
                <td className="px-4 py-3 text-gray-400">{list.genre || "-"}</td>
                <td className="px-4 py-3 text-gray-400">{list.content?.length || 0}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/lists/edit/${list._id}`} className="text-blue-400 hover:underline mr-4">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(list._id)} className="text-red-400 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {lists.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No lists yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Lists;
