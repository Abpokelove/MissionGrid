import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('MissionGrid render failure:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-space-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(139,92,246,0.14),transparent_30%),#020617]" />
        <div className="relative z-10 w-full max-w-xl glass-card p-8 text-center shadow-glow-blue">
          <div className="mx-auto mb-5 h-14 w-14 rounded-lg border border-neon-red/30 bg-neon-red/10 flex items-center justify-center text-neon-red font-display text-2xl">
            !
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.28em] text-neon-red">Render Fault</p>
          <h1 className="mt-3 font-display text-3xl font-bold">Command Console Recovered</h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            MissionGrid caught a client-side rendering fault before the screen could go blank.
          </p>
          {this.state.error?.message && (
            <pre className="mt-5 max-h-32 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-left text-xs text-gray-400">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary mt-6"
          >
            Reopen Console
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
