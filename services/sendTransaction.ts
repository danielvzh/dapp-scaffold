import { Instruction, Message, PubkeyUtil, RpcConnection, SignatureUtil, SanitizedMessageUtil } from '@saturnbtcio/arch-sdk';
import { BitcoinWallet } from '../wallet-adapter/core';

function hexToU8a32(hex: string): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

const signMessage = async (wallet: BitcoinWallet, message: string) => {
  try {
    // Sign with BIP322
    const bip322Signature = await wallet.signMessage(message, 'bip322-simple');
    console.log('BIP322 signature:', bip322Signature);

    return bip322Signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

export class ArchService {

  async sendTransaction(wallet: BitcoinWallet) {
    const connection = new RpcConnection('http://localhost:9002');
    const recentBlockhash = await connection.getBestBlockHash();
    const recentBlockhashBytes = hexToU8a32(recentBlockhash);

    // Create signer pubkey
    const rawSignerHex = wallet.getSignerAddress().publicKey;
    const normalizedSignerHex = wallet.walletName === 'unisat' ? rawSignerHex.slice(2) : rawSignerHex;
    const signer = PubkeyUtil.fromHex(normalizedSignerHex);
    console.log("signer (pubkey) in archService", signer);

    // Create an instruction
    const instructions: Instruction[] = [
      {
        program_id: PubkeyUtil.systemProgram(),
        accounts: [
          {
            pubkey: signer,
            is_signer: true,
            is_writable: true,
          },
        ],
        data: new Uint8Array([1, 2, 3, 4]), // Instruction data
      },
    ];

    // Create a SanitizedMessage
    const messageOrError = SanitizedMessageUtil.createSanitizedMessage(
      instructions,
      signer,
      recentBlockhashBytes
    );
    if (typeof messageOrError === 'string') {
      console.error('Failed to create sanitized message:', messageOrError);
      throw new Error(messageOrError);
    }
    const message = messageOrError;

    // Serialize message for signing
    const messageHash = new TextDecoder().decode(SanitizedMessageUtil.hash(message));

    // Sign with external wallet
    const bip322Signature = await signMessage(wallet, messageHash);
    const signature_to_send = SignatureUtil.adjustSignature(Buffer.from(bip322Signature, 'base64'));

    // Create the runtime transaction
    const transaction = {
      version: 0,
      signatures: [signature_to_send],
      message: message,
    };

    // Send transaction
    const txid = await connection.sendTransaction(transaction);
    console.log('Sent txid:', txid);

    // ✅ return the tx id to caller
    return txid;
  } catch(error: any) {
    console.error('Error sending transaction:', error);
    throw error;
  }
}