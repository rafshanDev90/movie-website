import { create } from "zustand";
import axios from "axios";

const api = axios.create({ baseURL: "/api/v1" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const useAdminStore = create((set) => ({
  token: localStorage.getItem("admin_token") || null,
  movies: [],
  lists: [],

  login: async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("admin_token", res.data.token);
      set({ token: res.data.token });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  },

  logout: () => {
    localStorage.removeItem("admin_token");
    set({ token: null });
  },

  fetchMovies: async () => {
    try {
      const res = await api.get("/movies");
      set({ movies: res.data.data });
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    }
  },

  createMovie: async (movieData) => {
    try {
      const res = await api.post("/movies", movieData);
      set((state) => ({ movies: [res.data.data, ...state.movies] }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to create movie" };
    }
  },

  updateMovie: async (id, movieData) => {
    try {
      const res = await api.put(`/movies/${id}`, movieData);
      set((state) => ({
        movies: state.movies.map((m) => (m._id === id ? res.data.data : m)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to update movie" };
    }
  },

  deleteMovie: async (id) => {
    try {
      await api.delete(`/movies/${id}`);
      set((state) => ({ movies: state.movies.filter((m) => m._id !== id) }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to delete movie" };
    }
  },

  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { success: true, url: res.data.url, filename: res.data.filename };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Upload failed" };
    }
  },

  fetchLists: async () => {
    try {
      const res = await api.get("/lists/all");
      set({ lists: res.data.data });
    } catch (error) {
      console.error("Failed to fetch lists:", error);
    }
  },

  createList: async (listData) => {
    try {
      const res = await api.post("/lists", listData);
      set((state) => ({ lists: [res.data.data, ...state.lists] }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to create list" };
    }
  },

  updateList: async (id, listData) => {
    try {
      const res = await api.put(`/lists/${id}`, listData);
      set((state) => ({
        lists: state.lists.map((l) => (l._id === id ? res.data.data : l)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to update list" };
    }
  },

  deleteList: async (id) => {
    try {
      await api.delete(`/lists/${id}`);
      set((state) => ({ lists: state.lists.filter((l) => l._id !== id) }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to delete list" };
    }
  },
}));
