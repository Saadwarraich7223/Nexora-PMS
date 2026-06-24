import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../../features/auth/authSlice.js";
import { connectSocket, disconnectSocket, onNotification } from "../../services/socket.js";
import { showSuccess } from "../../components/ui/toast.jsx";

const AppProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (user?._id) {
      connectSocket(user._id);

      const unsubscribe = onNotification((notif) => {
        const text = notif.title || notif.message;
        if (text) {
          showSuccess(`🔔 ${text}`);
        }
      });

      return () => {
        unsubscribe();
        disconnectSocket();
      };
    }
  }, [user?._id]);

  return children;
};

export default AppProvider;
