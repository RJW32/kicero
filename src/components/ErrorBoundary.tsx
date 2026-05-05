import {Component, type ErrorInfo, type ReactNode} from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary so a render crash in one route doesn't blank the
 * entire app. We log to the console (which surfaces to any error tracking
 * already wired up) and show a minimal recovery UI.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {hasError: false, error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof console !== 'undefined') {
      console.error('[Kicero] Render error caught by boundary:', error, info);
    }
  }

  private handleReset = () => {
    this.setState({hasError: false, error: null});
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-brand-white text-brand-black">
        <div className="max-w-md text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
            Something went wrong
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tighter mb-6 uppercase">
            We hit a snag
          </h1>
          <p className="text-brand-gray-600 font-light leading-relaxed mb-8">
            The page failed to render. Try reloading, or head home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-colors font-mono"
            >
              Reload page
            </button>
            <a
              href="/"
              onClick={this.handleReset}
              className="px-8 py-4 border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all font-mono"
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
