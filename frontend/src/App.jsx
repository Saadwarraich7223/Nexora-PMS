import AppRouter from "./app/routes/AppRouter.jsx";
import ErrorBoundary from "./components/ui/ErrorBoundary.jsx";

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;
