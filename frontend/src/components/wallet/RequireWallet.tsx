import { useAccount } from 'wagmi';
import type { ReactNode } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Wallet, Lock } from 'lucide-react';

interface RequireWalletProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireWallet({ children, fallback }: RequireWalletProps) {
  const { isConnected } = useAccount();
  const { open } = useAppKit();

  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 mb-6">
          <Lock className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-text-secondary text-center max-w-md mb-8 leading-relaxed">
          Please connect your wallet to access this page and interact with the platform.
        </p>
        <Button onClick={() => open()} variant="gradient" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
