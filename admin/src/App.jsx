import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAdminStore } from "./store/adminStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Movies from "./pages/Movies";
import MovieForm from "./pages/MovieForm";
import Lists from "./pages/Lists";
import ListForm from "./pages/ListForm";
import Layout from "./components/Layout";

function App() {
  const token = useAdminStore((s) => s.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        <Route element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/new" element={<MovieForm />} />
          <Route path="/movies/edit/:id" element={<MovieForm />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/lists/new" element={<ListForm />} />
          <Route path="/lists/edit/:id" element={<ListForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
