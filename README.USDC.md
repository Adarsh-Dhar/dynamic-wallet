# USDC Token Functionality

This crypto wallet MVP now includes full USDC token functionality on the Sepolia testnet using internal keypairs and server-side blockchain interactions.

## Features

### ✅ USDC Balance Checking
- Real-time USDC balance display using internal wallet keypairs
- Server-side blockchain interactions (no CORS issues)
- Balance refresh functionality

### ✅ USDC Token Transfer
- Send USDC tokens to any Ethereum address using internal keypairs
- Server-side transaction signing and submission
- Input validation for recipient addresses and amounts
- Transaction status tracking
- Success/error notifications

### ✅ Internal Keypair Integration
- Uses app-generated Ethereum keypairs stored securely in database
- No external wallet dependencies (MetaMask not required)
- Server-side blockchain interactions for security and reliability

## How to Use

### 1. Create a Wallet
1. Register/login to the app
2. Create a new wallet account in the dashboard
3. The app will generate a new Ethereum keypair for you

### 2. View USDC Balance
- Your USDC balance will be displayed in the Wallet Balance card
- Click the refresh button to update the balance
- Use the eye icon to show/hide balances

### 3. Send USDC
1. Click "Send USDC" or "Send" in the Quick Actions
2. Enter the recipient's Ethereum address (0x...)
3. Enter the amount of USDC to send
4. Click "Send" to initiate the transaction
5. The transaction will be signed and submitted server-side

## Technical Details

### USDC Contract Address (Sepolia)
```
0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

### Network Configuration
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://rpc.sepolia.org
- **Explorer**: https://sepolia.etherscan.io

### Server-Side API Endpoints
- `GET /api/usdc/balance?vaultId=<id>` - Get USDC balance
- `POST /api/usdc/send` - Send USDC transaction
- `GET /api/vaults/[id]` - Get vault data (including private keys)

### Dependencies
- `ethers.js` v6.15.0 for blockchain interactions
- `sonner` for toast notifications
- Internal keypair management
- Server-side blockchain interactions

## Getting Test USDC

To get test USDC on Sepolia:
1. Visit a Sepolia faucet (e.g., https://sepoliafaucet.com/)
2. Request test ETH first
3. Use the ETH to swap for USDC on a DEX like Uniswap
4. Or use a USDC faucet if available

## Error Handling

The app includes comprehensive error handling for:
- Invalid vault data
- Network connection issues
- Insufficient balance
- Invalid addresses
- Transaction failures
- Server-side validation

## Security Notes

- This is a testnet implementation
- Private keys are stored in the database (should be encrypted in production)
- All transactions are on Sepolia testnet
- Test USDC has no real value
- Server-side blockchain interactions prevent CORS issues

## Development

The USDC functionality is implemented in:
- `lib/usdc.ts` - Client-side USDC functions (API calls)
- `app/api/usdc/balance/route.ts` - Server-side balance checking
- `app/api/usdc/send/route.ts` - Server-side transaction sending
- `components/send-modal.tsx` - Send USDC modal
- `app/[id]/dashboard/[walletId]/actions/page.tsx` - Wallet actions page
- `app/api/vaults/[id]/route.ts` - Secure vault data endpoint
- `lib/types.ts` - TypeScript declarations 