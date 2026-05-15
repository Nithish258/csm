import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-10 text-center">
          <div className="h-20 w-20 bg-rose-100 rounded-3xl flex items-center justify-center mb-8 animate-pulse">
            <AlertCircle className="h-10 w-10 text-rose-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic mb-4">Runtime Error</h1>
          <p className="text-slate-500 font-medium max-w-md mb-10">
            The application encountered an unexpected state and crashed. 
            <br />
            <span className="text-rose-600 font-bold">Error: {this.state.error?.message}</span>
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            size="lg" 
            className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black text-lg active:scale-95 transition-all"
          >
            <RefreshCw className="h-6 w-6 mr-3" /> Restore Session
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
