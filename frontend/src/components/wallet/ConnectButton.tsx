import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown } from 'lucide-react';
import { formatAddress } from '@/lib/utils';

export function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        onClick={() => open({ view: 'Account' })}
        className="gap-2"
      >
        <div className="h-2 w-2 rounded-full bg-success" />
        {formatAddress(address)}
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button onClick={() => open()} className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
