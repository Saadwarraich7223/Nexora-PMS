import { useSelector } from "react-redux";
import Sidebar from "./Sidebar.jsx";
import TopNav from "./TopNav.jsx";
import CommandPalette from "../ui/CommandPalette.jsx";
import AIChatWindow from "../ai/AIChatWindow.jsx";
import AIChatBadge from "../ai/AIChatBadge.jsx";
import { useState } from "react";

const DashboardShell = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const role = (user?.role || "student").toLowerCase();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const CHAT_TITLES = {
    admin: "Admin Command Center",
    teacher: "Virtual Assistant",
    student: "Academic Coach"
  };

  return (
    <div
      className="h-screen w-full overflow-x-hidden scrollbar-hide"
      data-role={role}
    >
      <div className="h-full w-full border border-white/60 bg-glass backdrop-blur-2xl flex flex-col overflow-hidden">
        {/* Top Navbar - full width */}
        <div className="sticky top-0 z-20 w-full px-3 py-2">
          <TopNav />
        </div>

        {/* Content area */}
        <div className="flex flex-1 gap-5 px-5 overflow-hidden">
          {/* Sidebar BELOW navbar */}
          <Sidebar />

          {/* Main content */}
          <main className="flex-1 min-w-0 custom-scrollbar overflow-y-auto pr-2">
            <div className="space-y-6 pb-6 mt-2">{children}</div>
          </main>
        </div>
      </div>

      <CommandPalette />
      
      <AIChatWindow 
        role={role} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        title={CHAT_TITLES[role]}
      />
      <AIChatBadge 
        role={role} 
        isOpen={isChatOpen} 
        onClick={() => setIsChatOpen(!isChatOpen)} 
      />
    </div>
  );
};

export default DashboardShell;
