import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /*
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("react-router-dom") ||
            id.includes("react-dom") ||
            id.includes("node_modules/react/")
          ) {
            return "react";
          }

          if (
            id.includes("react-redux") ||
            id.includes("@reduxjs/toolkit")
          ) {
            return "redux";
          }

          if (id.includes("@monaco-editor/react") || id.includes("monaco-editor")) {
            return "monaco";
          }

          if (id.includes("@hello-pangea/dnd")) {
            return "dnd";
          }

          if (
            id.includes("react-icons") ||
            id.includes("react-hot-toast") ||
            id.includes("date-fns")
          ) {
            return "ui";
          }

          if (id.includes("axios")) {
            return "network";
          }

          return "vendor";
        },
      },
    },
  },
  */
});