// Catch-all handler for unmatched routes.
const notFoundMiddleware = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export default notFoundMiddleware;
