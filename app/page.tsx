'use client'

import { useState, useEffect } from 'react'
import { WalletName } from '@bitcoin-wallet-adapter'
import { Network } from '@saturnbtcio/psbt'
import { useWallet } from '../hooks/useWallet'
import { ArchService } from '../services/sendTransaction'
import { createAndFundAccount } from '@/services/createAccount'

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false)
  const { wallet, connected, status, connect, disconnect, paymentAddress } = useWallet()
  const [error, setError] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('mainnet')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleConnect = async (name: WalletName) => {
    setError(null)
    try {
      await connect(name, selectedNetwork)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    }
  }

  const handleSendArchTransaction = async () => {
    if (!wallet) {
      setError('No wallet connected')
      return
    }

    try {
      setError(null)

      try {
        await createAndFundAccount(wallet);
      } catch (error) {
        console.error('Failed to create account:', error);
      }

      const txid = await new ArchService().sendTransaction(wallet)
      console.log('✅ Arch transaction sent successfully:', txid)


    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    }
  }

  if (!isMounted) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ padding: '2rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      {!connected ? (
        <div>
          <h1 style={{ marginBottom: '2rem' }}>Connect Wallet</h1>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="network-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Select Network:
            </label>
            <select
              id="network-select"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value as Network)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                minWidth: '150px'
              }}
            >
              <option value="mainnet">Mainnet</option>
              <option value="testnet">Testnet</option>
              <option value="testnet4">Testnet4</option>
            </select>
          </div>

          <button
            onClick={() => handleConnect('unisat')}
            disabled={status === 'loading'}
            style={{
              marginRight: '1rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer'
            }}
          >
            {status === 'loading' ? 'Connecting...' : 'Connect Unisat'}
          </button>
          <button
            onClick={() => handleConnect('xverse')}
            disabled={status === 'loading'}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer'
            }}
          >
            {status === 'loading' ? 'Connecting...' : 'Connect Xverse'}
          </button>
        </div>
      ) : (
        <div>
          <h2>✅ Connected: {wallet?.walletName}</h2>
          <p>
            <strong>Network:</strong> {wallet?.network}
          </p>
          <button
            onClick={handleSendArchTransaction}
            style={{
              marginTop: '1rem',
              marginRight: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Send Arch Transaction
          </button>
          <button
            onClick={disconnect}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: '#dc3545', marginTop: '1rem' }}>
          Error: {error}
        </p>
      )}
    </div>
  )
}
