import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminStore } from "../store/adminStore";

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded transition-colors ${isActive ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-700"}`;

function Layout() {
  const logout = useAdminStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-gray-900 p-4 flex flex-col">
        <h1 className="text-xl font-bold text-red-600 mb-8 px-4">Admin Panel</h1>
        <nav className="flex flex-col gap-1">
          <NavLink to="/" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/movies" className={linkClass}>Movies</NavLink>
          <NavLink to="/lists" className={linkClass}>Lists</NavLink>
        </nav>
        <button onClick={handleLogout} className="mt-auto px-4 py-2 text-left text-gray-400 hover:text-white transition-colors">
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
