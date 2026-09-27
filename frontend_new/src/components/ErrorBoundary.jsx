import { Component } from 'react';

/** Last line of defense: a render error should never leave a blank page. */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('CaseAssist UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-50 p-6 text-ink-900 dark:bg-ink-950 dark:text-ink-100">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl font-semibold">This page hit an unexpected error</h1>
          <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
            Reload the page to continue. If it keeps happening, check the browser console for details.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 h-11 rounded-xl bg-verdigris-600 px-5 text-sm font-semibold text-white hover:bg-verdigris-500"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
