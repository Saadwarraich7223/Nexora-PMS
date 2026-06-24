import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api/client.js";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

// Import language support - order matters for dependencies
// Base languages first
import "prismjs/components/prism-markup"; // HTML/XML (required by many others)
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike"; // C-like (required by many others)
import "prismjs/components/prism-javascript";

// Languages that depend on base languages
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markup-templating"; // Required by PHP
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";

const SUPPORTED_IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const FILE_LANGUAGE_MAP = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  html: "markup",
  css: "css",
  json: "json",
  md: "markdown",
  txt: "plaintext",
  sql: "sql",
  cpp: "cpp",
  c: "c",
  java: "java",
  xml: "markup",
  yaml: "yaml",
  yml: "yaml",
  sh: "bash",
  php: "php",
  rb: "ruby",
  swift: "swift",
  go: "go",
  rs: "rust",
};

const FileViewerDrawer = ({ open, onClose, file }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [linesCount, setLinesCount] = useState(0);

  const fileName = file?.name || "Unnamed File";
  const fileUrl = file?.url || "";

  const downloadUrl = useMemo(() => {
    if (!fileUrl) return "";
    try {
      const urlObj = new URL(fileUrl, window.location.origin);
      urlObj.searchParams.delete("action");
      return urlObj.toString();
    } catch {
      return fileUrl.replace(/[?&]action=preview/i, "");
    }
  }, [fileUrl]);

  const extension = useMemo(
    () => fileName.split(".").pop().toLowerCase(),
    [fileName],
  );

  const fileTypeCategory = useMemo(() => {
    if (SUPPORTED_IMAGE_EXTS.includes(extension)) return "image";
    if (extension === "pdf") return "pdf";
    if (FILE_LANGUAGE_MAP[extension]) return "code";
    return "code";
  }, [extension]);

  const language = FILE_LANGUAGE_MAP[extension] || "plaintext";

  useEffect(() => {
    if (!open || !fileUrl) {
      setContent("");
      setError(false);
      setLinesCount(0);
      return;
    }

    if (fileTypeCategory !== "code") {
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get(fileUrl, { responseType: "text" });
        const text = String(res.data || "");
        setContent(text);
        setLinesCount(text.split("\n").length);
      } catch (err) {
        setError(true);
        const backendMessage = err.response?.data?.message || err.message;
        console.error("File Fetch Error:", backendMessage);
        setContent(`Failed to load file contents: ${backendMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [open, fileUrl, fileTypeCategory]);

  // Highlight syntax when content changes
  useEffect(() => {
    if (content && !loading && !error && fileTypeCategory === "code") {
      Prism.highlightAll();
    }
  }, [content, loading, error, fileTypeCategory]);

  return (
    <>
      <div
        className={`fixed inset-0  left-0 z-50 bg-slate-950/30 backdrop-blur-sm transition-all duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-2 py-4  sm:right-6 lg:right-10 z-[60] w-[85%] max-w-[500px] flex flex-col bg-[#0B0F19] border border-white/10 rounded-xl shadow-2xl transition-transform duration-100 ease-out ${open ? "translate-x-5" : "translate-x-[120%]"}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-lg rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-indigo-400 font-mono font-bold text-xs uppercase">
                {extension}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {fileName}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">
                {fileTypeCategory === "code"
                  ? `${language} - ${linesCount} lines`
                  : `${fileTypeCategory} document`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              Download Raw
            </a>
            <button
              onClick={onClose}
              className="rounded-lg bg-rose-500/10 border border-rose-500/20 w-9 h-9 flex items-center justify-center text-lg font-bold text-rose-400 shadow-sm hover:bg-rose-500/20 hover:text-rose-300 transition-all"
            >
              x
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {fileTypeCategory === "image" && (
            <div className="flex-1 flex items-center justify-center overflow-auto p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg ring-1 ring-white/10"
              />
            </div>
          )}

          {fileTypeCategory === "pdf" && (
            <div className="flex-1 rounded-b-2xl overflow-hidden bg-[#323639]">
              <iframe
                src={fileUrl}
                title={fileName}
                className="w-full h-full border-none"
              />
            </div>
          )}

          {fileTypeCategory === "code" && (
            <div className="flex-1 relative overflow-auto">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F19] z-10 w-full h-full">
                  <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                  <p className="text-indigo-400/80 text-xs font-medium tracking-widest uppercase animate-pulse">
                    Loading file...
                  </p>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F19] z-10 w-full h-full">
                  <p className="text-rose-400 text-sm font-mono border border-rose-500/20 bg-rose-500/5 px-4 py-3 rounded-lg">
                    {content}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-[#2d2d2d] rounded-b-2xl overflow-auto h-full">
                  <pre className="!m-0 !bg-transparent text-sm">
                    <code className={`language-${language}`}>{content}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FileViewerDrawer;
