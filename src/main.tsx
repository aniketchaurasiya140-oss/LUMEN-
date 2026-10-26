import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LUMEN Studio caught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141211] text-[#eae5de] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#1c1815] border border-[#3b342e] rounded-2xl p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#c45a2c] text-white flex items-center justify-center font-bold text-xl mx-auto">
              L
            </div>
            <h1 className="font-serif text-2xl text-white font-medium">Studio Initializer Notice</h1>
            <p className="text-xs text-[#a09789] leading-relaxed">
              The application encountered a runtime initialization signal.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-[#110f0e] border border-[#2b2520] rounded-lg text-[11px] font-mono text-amber-300 text-left overflow-x-auto max-h-36">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-[#c45a2c] hover:bg-[#b04f24] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reload LUMEN Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}
