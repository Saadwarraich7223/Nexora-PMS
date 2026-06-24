import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import searchApi from "../../services/api/searchApi";
import {
  FiSearch,
  FiGrid,
  FiUsers,
  FiCheckSquare,
  FiLayout,
  FiClock,
  FiVideo,
  FiBell,
  FiUser,
  FiPenTool,
  FiCommand,
  FiActivity,
  FiDatabase,
  FiFileText,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const ROLE_COMMANDS = {
  student: [
    {
      id: "s-dash",
      label: "Dashboard",
      icon: FiGrid,
      path: "/student",
      keywords: "home overview",
    },
    {
      id: "s-groups",
      label: "Groups",
      icon: FiUsers,
      path: "/student/groups",
      keywords: "team members",
    },
    {
      id: "s-tasks",
      label: "Tasks",
      icon: FiCheckSquare,
      path: "/student/tasks",
      keywords: "kanban todo",
    },
    {
      id: "s-projects",
      label: "Projects",
      icon: FiLayout,
      path: "/student/projects",
      keywords: "proposal submit",
    },
    {
      id: "s-meetings",
      label: "Meetings",
      icon: FiVideo,
      path: "/student/meetings",
      keywords: "log agenda",
    },
    {
      id: "s-deadlines",
      label: "Deadlines",
      icon: FiClock,
      path: "/student/deadlines",
      keywords: "due date",
    },
    {
      id: "s-notif",
      label: "Notifications",
      icon: FiBell,
      path: "/student/notifications",
      keywords: "alerts",
    },
    {
      id: "s-profile",
      label: "Profile",
      icon: FiUser,
      path: "/student/profile",
      keywords: "account settings",
    },
    {
      id: "s-canvas",
      label: "Architecture Canvas",
      icon: FiPenTool,
      path: "/student/canvas",
      keywords: "draw diagram whiteboard",
    },
  ],
  teacher: [
    {
      id: "t-dash",
      label: "Dashboard",
      icon: FiGrid,
      path: "/teacher",
      keywords: "home overview",
    },
    {
      id: "t-groups",
      label: "Groups",
      icon: FiUsers,
      path: "/teacher/groups",
      keywords: "assigned students",
    },
    {
      id: "t-projects",
      label: "Projects",
      icon: FiLayout,
      path: "/teacher/projects",
      keywords: "proposals review",
    },
    {
      id: "t-meetings",
      label: "Meetings",
      icon: FiVideo,
      path: "/teacher/meetings",
      keywords: "schedule log",
    },
    {
      id: "t-deadlines",
      label: "Deadlines",
      icon: FiClock,
      path: "/teacher/deadlines",
      keywords: "due date",
    },
    {
      id: "t-notif",
      label: "Notifications",
      icon: FiBell,
      path: "/teacher/notifications",
      keywords: "alerts",
    },
    {
      id: "t-profile",
      label: "Profile",
      icon: FiUser,
      path: "/teacher/profile",
      keywords: "account settings",
    },
  ],
  admin: [
    {
      id: "a-dash",
      label: "Dashboard",
      icon: FiGrid,
      path: "/admin",
      keywords: "home analytics",
    },
    {
      id: "a-faculty",
      label: "Faculty",
      icon: FiUsers,
      path: "/admin/faculty",
      keywords: "teachers",
    },
    {
      id: "a-groups",
      label: "Groups",
      icon: FiUsers,
      path: "/admin/groups",
      keywords: "students teams",
    },
    {
      id: "a-students",
      label: "Students",
      icon: FiUser,
      path: "/admin/students",
      keywords: "members",
    },
    {
      id: "a-announce",
      label: "Announcements",
      icon: FiBell,
      path: "/admin/announcements",
      keywords: "broadcast",
    },
    {
      id: "a-profile",
      label: "Profile",
      icon: FiUser,
      path: "/admin/profile",
      keywords: "account settings",
    },
  ],
};

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || "student";

  const commands = ROLE_COMMANDS[role] || ROLE_COMMANDS.student;

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.keywords.toLowerCase().includes(q),
    );
  }, [query, commands]);

  // Debounced Global Search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchApi.globalSearch(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Flatten results for unified arrow navigation
  const flatResults = useMemo(() => {
    const list = [...filteredCommands.map(c => ({ ...c, type: 'command' }))];
    
    if (searchResults) {
      if (searchResults.projects?.length) 
        list.push(...searchResults.projects.map(p => ({ ...p, id: p._id, label: p.title, type: 'project', path: `/${role}/projects`, icon: FiLayout, isAiReranked: true })));
      if (searchResults.users?.length) 
        list.push(...searchResults.users.map(u => ({ ...u, id: u._id, label: u.name, type: 'user', path: `/${role}/faculty`, icon: FiUser })));
      if (searchResults.groups?.length) 
        list.push(...searchResults.groups.map(g => ({ ...g, id: g._id, label: g.name, type: 'group', path: `/${role}/groups`, icon: FiUsers })));
      if (searchResults.tasks?.length) 
        list.push(...searchResults.tasks.map(t => ({ ...t, id: t._id, label: t.title, type: 'task', path: `/${role}/tasks`, icon: FiCheckSquare })));
    }
    
    return list;
  }, [filteredCommands, searchResults, role]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const customHandler = () => setOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener("open-command-palette", customHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-command-palette", customHandler);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      }
    }
  };

  const handleSelect = (item) => {
    navigate(item.path);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden animate-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <FiSearch className="text-slate-400 shrink-0" size={16} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-mono text-slate-500 border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2 px-2 scrollbar-thin scrollbar-thumb-slate-200">
          {isSearching && flatResults.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <FiActivity className="text-indigo-500 animate-spin" size={20} />
              <p className="text-xs text-slate-400 font-medium">Scanning system...</p>
            </div>
          ) : flatResults.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No results found</p>
              <p className="text-[11px] text-slate-300 mt-1">Try a different search term</p>
            </div>
          ) : (
            flatResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group/item ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "bg-white/20" : "bg-slate-100"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={isSelected ? "text-white" : "text-slate-500"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <p className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-slate-700"}`}>
                         {item.label}
                       </p>
                       {item.isAiReranked && (
                          <span className={`flex items-center gap-0.5 px-1 rounded text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                             <HiSparkles size={8} /> RAG
                          </span>
                       )}
                    </div>
                    <p className={`text-[10px] truncate uppercase tracking-widest font-bold opacity-60 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                      {item.type} &bull; {item.type === 'command' ? 'Action' : 'System Record'}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] font-mono text-slate-400 bg-white/10 px-1.5 py-0.5 rounded shrink-0 scale-90">
                      Enter
                    </span>
                  )}
                  {!isSelected && item.type !== 'command' && (
                    <FiDatabase size={12} className="text-slate-200" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 text-[9px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-mono">
                ↑
              </kbd>
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-mono">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-mono">
                Enter
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-mono">
                Esc
              </kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-400">
            <FiCommand size={9} />
            Nexora Command
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-in {
          animation: fadeSlideIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CommandPalette;
