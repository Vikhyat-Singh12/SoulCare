import axios from "axios";

const axiosInstance = axios.create({
  // import.meta.env.MODE is the correct Vite way to check dev vs prod
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
  withCredentials: true, // send cookies with every request
});

export default axiosInstance;