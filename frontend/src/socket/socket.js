import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export default socket;