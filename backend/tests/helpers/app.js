export const getTestApp = async () => {
  const mod = await import("../../src/app.js");
  return mod.default;
};
