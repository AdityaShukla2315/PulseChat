import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      // Validate image data URL if present
      if (data.profilePic && typeof data.profilePic === 'string') {
        if (!data.profilePic.startsWith('data:image')) {
          toast.error('Invalid image format.');
          set({ isUpdatingProfile: false });
          return;
        }
        // Optionally check size (base64 length)
        const base64Length = data.profilePic.length - data.profilePic.indexOf(',') - 1;
        const approxSize = (base64Length * 3) / 4; // bytes
        if (approxSize > 2 * 1024 * 1024) {
          toast.error('Image size should be less than 2MB');
          set({ isUpdatingProfile: false });
          return;
        }
      }
      console.log('Sending update request with data:', data);
      const res = await axiosInstance.put("/auth/update-profile", data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Update response:', res.data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
      return res.data;
    } catch (error) {
      console.error("Error in update profile:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to update profile';
      toast.error(errorMessage);
      throw error; // Re-throw to allow handling in the component
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) {
      console.log('No auth user, skipping socket connection');
      return;
    }
    
    // Disconnect existing socket if any
    if (get().socket) {
      console.log('Disconnecting existing socket');
      get().disconnectSocket();
    }

    console.log('Connecting to socket server...');
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      set({ socket });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Reconnect if the server disconnects us
        console.log('Attempting to reconnect...');
        socket.connect();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Online users
    socket.on("getOnlineUsers", (userIds) => {
      console.log('Online users updated:', userIds);
      set({ onlineUsers: userIds });
    });
    
    // Connect the socket
    socket.connect();
    
    // Store the socket in state
    set({ socket });
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      console.log('Disconnecting socket...');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.off('getOnlineUsers');
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
      console.log('Socket disconnected and cleaned up');
    }
  },
}));
