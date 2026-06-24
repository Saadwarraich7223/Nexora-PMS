import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--bg-primary)] p-4 text-center text-[var(--text-primary)]">
          <h1 className="mb-4 text-4xl font-bold text-red-500">Oops! Something went wrong.</h1>
          <p className="mb-8 text-neutral-400">An unexpected error occurred in this view.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-[var(--accent-primary)] px-4 py-2 font-medium text-white transition hover:opacity-90"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
