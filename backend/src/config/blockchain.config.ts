import { registerAs } from '@nestjs/config';

export default registerAs('blockchain', () => ({
  rpcUrl: process.env['RPC_URL'] || 'https://rpc.hoodi.ethpandaops.io',
  carSharesContract: process.env['CARSHARES_CONTRACT'] || '0x1d02bb94857b23aA30EBF1eeA703650dbCb7276A',
  marketplaceContract: process.env['MARKETPLACE_CONTRACT'] || '0xC767915cDF8cB5dF72aD46C3F8B8fE56F6001B91',
  chainId: parseInt(process.env['CHAIN_ID'] || '560048', 10),
}));
