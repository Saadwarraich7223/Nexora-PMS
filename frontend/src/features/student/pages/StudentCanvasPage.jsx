import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import studentApi from "../api/studentApi.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import getErrorMessage from "../../../utils/error.js";
import {
  FiArrowLeft,
  FiSave,
  FiUsers,
  FiWifi,
  FiWifiOff,
  FiMaximize,
  FiMinimize,
  FiRefreshCw,
  FiSquare,
  FiCircle,
  FiType,
  FiMinus,
  FiTrash2,
  FiMove,
  FiMousePointer,
  FiEdit3,
  FiDownload,
} from "react-icons/fi";
import "../studentTheme.css";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// -- Shape Helpers -------------------------------------------------------------
const genId = () => `shape_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const COLORS = ["#1e293b", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
const SHAPE_DEFAULTS = {
  rect: { type: "rect", x: 100, y: 100, w: 160, h: 100, fill: "#3b82f6", text: "", stroke: "#1e293b", strokeWidth: 2 },
  circle: { type: "circle", x: 200, y: 200, r: 50, fill: "#8b5cf6", text: "", stroke: "#1e293b", strokeWidth: 2 },
  text: { type: "text", x: 150, y: 150, text: "Text", fontSize: 16, fill: "#1e293b" },
  line: { type: "line", x1: 100, y1: 100, x2: 300, y2: 200, stroke: "#1e293b", strokeWidth: 2 },
  freehand: { type: "freehand", points: [], stroke: "#1e293b", strokeWidth: 2 },
};

// -- Canvas Renderer ----------------------------------------------------------
const drawShape = (ctx, shape, isSelected) => {
  ctx.save();
  if (shape.type === "rect") {
    ctx.fillStyle = shape.fill || "#3b82f6";
    ctx.strokeStyle = shape.stroke || "#1e293b";
    ctx.lineWidth = shape.strokeWidth || 2;
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(shape.x + radius, shape.y);
    ctx.lineTo(shape.x + shape.w - radius, shape.y);
    ctx.quadraticCurveTo(shape.x + shape.w, shape.y, shape.x + shape.w, shape.y + radius);
    ctx.lineTo(shape.x + shape.w, shape.y + shape.h - radius);
    ctx.quadraticCurveTo(shape.x + shape.w, shape.y + shape.h, shape.x + shape.w - radius, shape.y + shape.h);
    ctx.lineTo(shape.x + radius, shape.y + shape.h);
    ctx.quadraticCurveTo(shape.x, shape.y + shape.h, shape.x, shape.y + shape.h - radius);
    ctx.lineTo(shape.x, shape.y + radius);
    ctx.quadraticCurveTo(shape.x, shape.y, shape.x + radius, shape.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (shape.text) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(shape.text, shape.x + shape.w / 2, shape.y + shape.h / 2);
    }
  } else if (shape.type === "circle") {
    ctx.fillStyle = shape.fill || "#8b5cf6";
    ctx.strokeStyle = shape.stroke || "#1e293b";
    ctx.lineWidth = shape.strokeWidth || 2;
    ctx.beginPath();
    ctx.arc(shape.x, shape.y, shape.r || 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (shape.text) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(shape.text, shape.x, shape.y);
    }
  } else if (shape.type === "text") {
    ctx.fillStyle = shape.fill || "#1e293b";
    ctx.font = `${shape.fontSize || 16}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(shape.text || "Text", shape.x, shape.y);
  } else if (shape.type === "line") {
    ctx.strokeStyle = shape.stroke || "#1e293b";
    ctx.lineWidth = shape.strokeWidth || 2;
    ctx.beginPath();
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
    // Arrowhead
    const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
    const headLen = 12;
    ctx.beginPath();
    ctx.moveTo(shape.x2, shape.y2);
    ctx.lineTo(shape.x2 - headLen * Math.cos(angle - Math.PI / 6), shape.y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(shape.x2, shape.y2);
    ctx.lineTo(shape.x2 - headLen * Math.cos(angle + Math.PI / 6), shape.y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  } else if (shape.type === "freehand" && shape.points?.length > 1) {
    ctx.strokeStyle = shape.stroke || "#1e293b";
    ctx.lineWidth = shape.strokeWidth || 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (let i = 1; i < shape.points.length; i++) {
      ctx.lineTo(shape.points[i].x, shape.points[i].y);
    }
    ctx.stroke();
  }
  // Selection border
  if (isSelected) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    const bounds = getShapeBounds(shape);
    ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
    ctx.setLineDash([]);
  }
  ctx.restore();
};

const getShapeBounds = (shape) => {
  if (shape.type === "rect") return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
  if (shape.type === "circle") return { x: shape.x - shape.r, y: shape.y - shape.r, w: shape.r * 2, h: shape.r * 2 };
  if (shape.type === "text") return { x: shape.x, y: shape.y, w: 100, h: (shape.fontSize || 16) + 4 };
  if (shape.type === "line") {
    const x = Math.min(shape.x1, shape.x2);
    const y = Math.min(shape.y1, shape.y2);
    return { x, y, w: Math.abs(shape.x2 - shape.x1) || 10, h: Math.abs(shape.y2 - shape.y1) || 10 };
  }
  if (shape.type === "freehand" && shape.points?.length) {
    const xs = shape.points.map((p) => p.x);
    const ys = shape.points.map((p) => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    return { x: minX, y: minY, w: Math.max(...xs) - minX || 10, h: Math.max(...ys) - minY || 10 };
  }
  return { x: 0, y: 0, w: 0, h: 0 };
};

const hitTest = (shape, px, py) => {
  const b = getShapeBounds(shape);
  return px >= b.x - 6 && px <= b.x + b.w + 6 && py >= b.y - 6 && py <= b.y + b.h + 6;
};

// -- Main Component ------------------------------------------------------------
const StudentCanvasPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const canvasRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState("loading");
  const [socketConnected, setSocketConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const socketRef = useRef(null);

  // Canvas state
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select"); // select | rect | circle | text | line | freehand
  const [currentColor, setCurrentColor] = useState("#3b82f6");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawingShape, setDrawingShape] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [editText, setEditText] = useState("");

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [groupRes, projectRes] = await Promise.all([
          studentApi.fetchMyGroup().catch(() => ({ group: null })),
          studentApi.fetchProject().catch(() => ({ project: null })),
        ]);
        setGroup(groupRes.group || null);
        setProject(projectRes.project || null);
        if (projectRes.project?.architectureCanvasState?.shapes) {
          setShapes(projectRes.project.architectureCanvasState.shapes);
        }
        setStatus("ready");
      } catch (err) {
        setStatus("error");
        showError(getErrorMessage(err, "Failed to load canvas data."));
      }
    };
    load();
  }, []);

  // Socket
  useEffect(() => {
    if (!group?._id) return;
    const sock = io(`${SOCKET_URL}/canvas`, { transports: ["websocket"], reconnectionAttempts: 5 });
    socketRef.current = sock;

    sock.on("connect", () => {
      setSocketConnected(true);
      sock.emit("join-room", group._id);
    });
    sock.on("disconnect", () => setSocketConnected(false));
    sock.on("canvas-update", (updates) => {
      if (updates?.shapes) setShapes(updates.shapes);
    });
    sock.on("cursor-move", () => {});

    return () => { sock.disconnect(); };
  }, [group?._id]);

  // Broadcast changes
  const broadcastShapes = useCallback((newShapes) => {
    if (socketRef.current && group?._id) {
      socketRef.current.emit("canvas-update", { groupId: group._id, updates: { shapes: newShapes } });
    }
  }, [group?._id]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    // Clear
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    // Grid
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.offsetWidth; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.offsetHeight); ctx.stroke();
    }
    for (let y = 0; y < canvas.offsetHeight; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.offsetWidth, y); ctx.stroke();
    }
    // Shapes
    shapes.forEach((s) => drawShape(ctx, s, s.id === selectedId));
    if (drawingShape) drawShape(ctx, drawingShape, false);
  }, [shapes, selectedId, drawingShape]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    });
    obs.observe(canvas.parentElement);
    return () => obs.disconnect();
  }, []);

  // Get mouse position relative to canvas
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Mouse handlers
  const handleMouseDown = (e) => {
    const pos = getPos(e);
    if (tool === "select") {
      const hit = [...shapes].reverse().find((s) => hitTest(s, pos.x, pos.y));
      if (hit) {
        setSelectedId(hit.id);
        setIsDragging(true);
        setDragStart(pos);
        const bounds = getShapeBounds(hit);
        setDragOffset({ x: pos.x - bounds.x, y: pos.y - bounds.y });
      } else {
        setSelectedId(null);
      }
    } else if (tool === "rect") {
      setDrawingShape({ ...SHAPE_DEFAULTS.rect, id: genId(), x: pos.x, y: pos.y, w: 0, h: 0, fill: currentColor });
      setDragStart(pos);
    } else if (tool === "circle") {
      setDrawingShape({ ...SHAPE_DEFAULTS.circle, id: genId(), x: pos.x, y: pos.y, r: 0, fill: currentColor });
      setDragStart(pos);
    } else if (tool === "line") {
      setDrawingShape({ ...SHAPE_DEFAULTS.line, id: genId(), x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, stroke: currentColor });
      setDragStart(pos);
    } else if (tool === "text") {
      const newShape = { ...SHAPE_DEFAULTS.text, id: genId(), x: pos.x, y: pos.y, fill: currentColor, text: "Text" };
      const updated = [...shapes, newShape];
      setShapes(updated);
      broadcastShapes(updated);
      setSelectedId(newShape.id);
      setEditingTextId(newShape.id);
      setEditText("Text");
      setTool("select");
    } else if (tool === "freehand") {
      setDrawingShape({ ...SHAPE_DEFAULTS.freehand, id: genId(), points: [pos], stroke: currentColor });
    }
  };

  const handleMouseMove = (e) => {
    const pos = getPos(e);
    if (tool === "select" && isDragging && selectedId) {
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== selectedId) return s;
          const dx = pos.x - dragStart.x;
          const dy = pos.y - dragStart.y;
          if (s.type === "rect" || s.type === "text") return { ...s, x: s.x + dx, y: s.y + dy };
          if (s.type === "circle") return { ...s, x: s.x + dx, y: s.y + dy };
          if (s.type === "line") return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy };
          if (s.type === "freehand") return { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
          return s;
        }),
      );
      setDragStart(pos);
    } else if (drawingShape) {
      if (drawingShape.type === "rect") {
        setDrawingShape((prev) => ({
          ...prev,
          w: pos.x - dragStart.x,
          h: pos.y - dragStart.y,
        }));
      } else if (drawingShape.type === "circle") {
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        setDrawingShape((prev) => ({ ...prev, r: Math.sqrt(dx * dx + dy * dy) }));
      } else if (drawingShape.type === "line") {
        setDrawingShape((prev) => ({ ...prev, x2: pos.x, y2: pos.y }));
      } else if (drawingShape.type === "freehand") {
        setDrawingShape((prev) => ({ ...prev, points: [...prev.points, pos] }));
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      broadcastShapes(shapes);
    }
    if (drawingShape) {
      // Normalize negative-dimension rects
      let final = { ...drawingShape };
      if (final.type === "rect") {
        if (final.w < 0) { final.x += final.w; final.w = Math.abs(final.w); }
        if (final.h < 0) { final.y += final.h; final.h = Math.abs(final.h); }
        if (final.w < 5 && final.h < 5) { setDrawingShape(null); return; }
      }
      if (final.type === "circle" && final.r < 5) { setDrawingShape(null); return; }
      if (final.type === "freehand" && final.points.length < 3) { setDrawingShape(null); return; }
      const updated = [...shapes, final];
      setShapes(updated);
      broadcastShapes(updated);
      setSelectedId(final.id);
      setDrawingShape(null);
      setTool("select");
    }
  };

  // Delete selected
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const updated = shapes.filter((s) => s.id !== selectedId);
    setShapes(updated);
    setSelectedId(null);
    broadcastShapes(updated);
  }, [selectedId, shapes, broadcastShapes]);

  // Double-click to edit text
  const handleDoubleClick = (e) => {
    const pos = getPos(e);
    const hit = [...shapes].reverse().find((s) => hitTest(s, pos.x, pos.y));
    if (hit && (hit.type === "rect" || hit.type === "circle" || hit.type === "text")) {
      setSelectedId(hit.id);
      setEditingTextId(hit.id);
      setEditText(hit.text || "");
    }
  };

  const commitTextEdit = () => {
    if (!editingTextId) return;
    const updated = shapes.map((s) => s.id === editingTextId ? { ...s, text: editText } : s);
    setShapes(updated);
    broadcastShapes(updated);
    setEditingTextId(null);
  };

  // Save
  const handleSave = useCallback(async () => {
    if (!project?._id) return;
    setSaving(true);
    try {
      await studentApi.apiClient.patch(`/api/student/projects/${project._id}/canvas`, {
        canvasState: { shapes },
      });
      setLastSaved(new Date());
      showSuccess("Canvas saved!");
    } catch (err) {
      showError(getErrorMessage(err, "Failed to save canvas."));
    } finally {
      setSaving(false);
    }
  }, [shapes, project?._id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (editingTextId) return; // don't intercept text editing
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedId) { e.preventDefault(); deleteSelected(); } }
      if (e.key === "Escape") { setSelectedId(null); setTool("select"); }
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "r" || e.key === "R") setTool("rect");
      if (e.key === "c" || e.key === "C") setTool("circle");
      if (e.key === "t" || e.key === "T") setTool("text");
      if (e.key === "l" || e.key === "L") setTool("line");
      if (e.key === "p" || e.key === "P") setTool("freehand");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, deleteSelected, selectedId, editingTextId]);

  // Export as PNG
  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${project?.title || "canvas"}-architecture.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  // Guard: no group/project
  if (status === "ready" && (!group || !project)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-900 flex items-center justify-center mb-6 shadow-lg">
            <span className="text-3xl">🎨</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Architecture Canvas</h1>
          <p className="text-sm text-slate-500 mb-6">
            {!group
              ? "Join or create a group first to use the collaborative canvas."
              : "Submit a project proposal to unlock the architecture canvas."}
          </p>
          <button onClick={() => navigate(!group ? "/student/groups" : "/student/projects")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors">
            <FiArrowLeft size={14} />
            {!group ? "Go to Groups" : "Go to Projects"}
          </button>
        </div>
      </div>
    );
  }

  const TOOLS = [
    { id: "select", icon: FiMousePointer, label: "Select (V)", shortcut: "V" },
    { id: "rect", icon: FiSquare, label: "Rectangle (R)", shortcut: "R" },
    { id: "circle", icon: FiCircle, label: "Circle (C)", shortcut: "C" },
    { id: "line", icon: FiMinus, label: "Arrow (L)", shortcut: "L" },
    { id: "text", icon: FiType, label: "Text (T)", shortcut: "T" },
    { id: "freehand", icon: FiEdit3, label: "Pen (P)", shortcut: "P" },
  ];

  return (
    <div className={`flex flex-col bg-white ${isFullscreen ? "fixed inset-0 z-[100]" : "h-screen"}`}>
      {/* -- Top Toolbar -- */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white/95 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/student/projects")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            <FiArrowLeft size={12} /> Back
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">{project?.title || "Architecture Canvas"}</h1>
            <p className="text-[10px] text-slate-400">{group?.name} | Collaborative whiteboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold ${socketConnected ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
            {socketConnected ? <FiWifi size={9} /> : <FiWifiOff size={9} />}
            {socketConnected ? "Live" : "Offline"}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">
            <FiUsers size={9} /> {connectedUsers.length || 1}
          </span>
          <button onClick={exportCanvas} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            <FiDownload size={10} /> Export
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-700 transition-colors disabled:opacity-50">
            {saving ? <FiRefreshCw size={10} className="animate-spin" /> : <FiSave size={10} />}
            {saving ? "Saving..." : "Save"}
          </button>
          {lastSaved && <span className="hidden lg:block text-[9px] text-slate-400">Saved {lastSaved.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>}
          <button onClick={toggleFullscreen} className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            {isFullscreen ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
          </button>
        </div>
      </div>

      {/* -- Main Area -- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Tool Palette */}
        <div className="w-12 border-r border-slate-200 bg-white flex flex-col items-center py-3 gap-1 shrink-0">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTool(id)} title={label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${tool === id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>
              <Icon size={14} />
            </button>
          ))}
          <div className="w-6 border-t border-slate-200 my-2" />
          <button onClick={deleteSelected} disabled={!selectedId} title="Delete (Del)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <FiTrash2 size={14} />
          </button>
          <div className="w-6 border-t border-slate-200 my-2" />
          {/* Color Picker dots */}
          <div className="flex flex-col gap-1.5">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setCurrentColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${currentColor === c ? "border-slate-800 scale-110" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {status === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ cursor: tool === "select" ? (isDragging ? "grabbing" : "default") : "crosshair" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
              />
              {/* Inline text editor */}
              {editingTextId && (() => {
                const shape = shapes.find((s) => s.id === editingTextId);
                if (!shape) return null;
                const bounds = getShapeBounds(shape);
                return (
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={commitTextEdit}
                    onKeyDown={(e) => { if (e.key === "Enter") commitTextEdit(); }}
                    className="absolute bg-white border-2 border-blue-400 rounded px-2 py-1 text-sm outline-none shadow-lg z-30"
                    style={{ left: bounds.x, top: bounds.y - 30, minWidth: 120 }}
                  />
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* -- Bottom Status Bar -- */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-200 bg-white/95 text-[9px] text-slate-400 font-medium shrink-0">
        <span>{shapes.length} shape{shapes.length !== 1 ? "s" : ""} | Tool: {tool} | Color: <span className="inline-block w-2 h-2 rounded-full align-middle" style={{ backgroundColor: currentColor }} /></span>
        <div className="flex items-center gap-3">
          <span>{socketConnected ? "🟢 Connected" : "🔴 Disconnected"}</span>
          <span>Shortcuts: V R C L T P Del</span>
          {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
        </div>
      </div>
    </div>
  );
};

export default StudentCanvasPage;
