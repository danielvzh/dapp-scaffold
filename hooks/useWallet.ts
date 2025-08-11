import { useState, useCallback } from 'react';
import {
  BitcoinWallet,
  WalletName,
  WalletException,
  UnsignedPsbt,
  UnisatWallet,
  XverseWallet,
} from '../wallet-adapter/core';
import { Network } from '@saturnbtcio/psbt';

export const useWallet = () => {
  const [wallet, setWallet] = useState<BitcoinWallet | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [connected, setConnected] = useState(false);
  const [walletPubkey, setWalletPubkey] = useState<string | null>(null);

  const connect = useCallback(
    async (walletName: WalletName, network: Network) => {
      setStatus('loading');
      try {
        let walletInstance: BitcoinWallet;

        switch (walletName) {
          case 'unisat':
            const unisatWallet = new UnisatWallet(network, []);
            walletInstance = await unisatWallet.initialize(network);
            break;
          case 'xverse':
            const xverseWallet = new XverseWallet(network, [], 'software' as any, 'software');
            walletInstance = await xverseWallet.initialize(network);
            break;
          case 'magic-eden':
            throw new Error('Magic Eden wallet not yet implemented');
          default:
            throw new Error('Unsupported wallet');
        }

        setWallet(walletInstance);
        setConnected(true);

        // Get the public key from the wallet
        try {
          let pubkey: string | null = null;
          if (walletName === 'unisat' && (window as any).unisat) {
            pubkey = await (window as any).unisat.getPublicKey();
            console.log('Got Unisat public key:', pubkey);
          } else if (walletName === 'xverse') {
            // For Xverse, the pubkey might be available in the address object
            pubkey = walletInstance.runeAddress?.publicKey || null;
            console.log('Got Xverse public key:', pubkey);
          }
          setWalletPubkey(pubkey);
        } catch (error) {
          console.warn('Could not get wallet public key:', error);
          setWalletPubkey(null);
        }

        return walletInstance;
      } catch (error) {
        if (error instanceof WalletException) {
          console.error('Wallet error:', error.message);
        }
        throw error;
      } finally {
        setStatus('idle');
      }
    },
    [],
  );

  const signPsbt = useCallback(
    async (
      unsignedPsbt: UnsignedPsbt,
      broadcast: boolean,
      handlers?: {
        onSuccess?: () => void;
        onError?: (error: WalletException | Error) => void;
      },
    ) => {
      if (!wallet) {
        throw new WalletException('wallet_not_connected');
      }

      setStatus('loading');
      try {
        const signedPsbt = await wallet.signPsbt(unsignedPsbt, broadcast);
        handlers?.onSuccess?.();
        return signedPsbt;
      } catch (error) {
        handlers?.onError?.(error as WalletException | Error);
        throw error;
      } finally {
        setStatus('idle');
      }
    },
    [wallet],
  );

  const disconnect = useCallback(() => {
    setWallet(null);
    setConnected(false);
    setWalletPubkey(null);
  }, []);

  return {
    wallet,
    connected,
    status,
    connect,
    signPsbt,
    disconnect,
    walletPubkey,
    runeAddress: wallet?.runeAddress || null,
    paymentAddress: wallet?.paymentAddress || null,
    addresses: wallet?.addresses || [],
  };
};