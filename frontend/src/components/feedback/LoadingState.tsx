import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 ${fullScreen ? 'min-h-screen bg-background' : 'min-h-[400px]'}`}>
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="absolute inset-0 h-16 w-16 rounded-2xl bg-primary/20 animate-ping" />
      </div>
      <p className="text-text-secondary mt-6 font-medium">{message}</p>
    </div>
  );
}
