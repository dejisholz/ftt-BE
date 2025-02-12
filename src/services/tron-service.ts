const TronWeb = require('tronweb');
import { 
  TRON_FULL_NODE, 
  TRON_SOLIDITY_NODE, 
  TRON_EVENT_SERVER,
  MERCHANT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  PRIVATE_KEY 
} from '../config/constants';

// Initialize TronWeb instance without private key for read-only operations
const tronWeb = new TronWeb({
  fullHost: TRON_FULL_NODE,  // Using fullHost instead of separate nodes
  privateKey: '0000000000000000000000000000000000000000000000000000000000000001' // Default private key for read-only operations
});

// Set default address if needed
if (MERCHANT_ADDRESS) {
  tronWeb.setAddress(MERCHANT_ADDRESS);
}

export interface TransactionVerificationResult {
  success: boolean;
  message: string;
}

export const verifyUSDTTransaction = async (txHash: string): Promise<TransactionVerificationResult> => {
  try {
    // Get transaction info
    const txInfo = await tronWeb.trx.getTransaction(txHash);
    if (!txInfo) {
      return { success: false, message: 'Transaction not found' };
    }

    // Get transaction info from contract
    const txContract = await tronWeb.trx.getTransactionInfo(txHash);
    if (!txContract) {
      return { success: false, message: 'Contract transaction info not found' };
    }

    // Verify it's a TRC20 transfer to the merchant address
    if (txInfo.raw_data.contract[0].type !== 'TriggerSmartContract') {
      return { success: false, message: 'Not a TRC20 transfer' };
    }

    // Verify it's the USDT contract
    const contractAddress = txInfo.raw_data.contract[0].parameter.value.contract_address;
    if (tronWeb.address.fromHex(contractAddress) !== USDT_CONTRACT_ADDRESS) {
      return { success: false, message: 'Not a USDT transfer' };
    }

    // Verify the recipient is the merchant
    const to = txInfo.raw_data.contract[0].parameter.value.to;
    if (tronWeb.address.fromHex(to) !== MERCHANT_ADDRESS) {
      return { success: false, message: 'Invalid recipient' };
    }

    // Verify transaction status
    if (!txContract.receipt || txContract.receipt.result !== 'SUCCESS') {
      return { success: false, message: 'Transaction failed' };
    }

    return { success: true, message: 'Transaction verified successfully' };
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return { success: false, message: 'Error verifying transaction' };
  }
}; 