import { useState, useEffect, useCallback } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  Download,
  Send,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Droplets,
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react';
import Modal from '../components/Modal';
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToKeypair,
  privateKeyToKeypair,
  keypairToPrivateKey,
  saveWallet,
  loadWallet,
  hasStoredWallet,
  clearWallet,
  getBalance,
  sendSol,
  requestAirdrop,
  getRecentTransactions,
  isValidSolanaAddress,
  shortenAddress,
  formatSol,
  getNetwork,
  setNetwork,
  NETWORKS
} from '../utils/solanaWallet';

function Wallet() {
  const [keypair, setKeypair] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [network, setNetworkState] = useState(getNetwork());
  const [copied, setCopied] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const [mnemonic, setMnemonic] = useState('');
  const [importType, setImportType] = useState('mnemonic');
  const [importValue, setImportValue] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!keypair) return;
    try {
      const bal = await getBalance(keypair.publicKey.toString());
      setBalance(bal);
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    }
  }, [keypair]);

  const fetchTransactions = useCallback(async () => {
    if (!keypair) return;
    try {
      const txs = await getRecentTransactions(keypair.publicKey.toString());
      setTransactions(txs);
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    }
  }, [keypair]);

  useEffect(() => {
    if (hasStoredWallet() && !keypair) {
      setShowUnlockModal(true);
    }
  }, [keypair]);

  useEffect(() => {
    if (keypair) {
      fetchBalance();
      fetchTransactions();
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [keypair, fetchBalance, fetchTransactions]);

  const handleNetworkChange = (newNetwork) => {
    setNetwork(newNetwork);
    setNetworkState(newNetwork);
    setBalance(null);
    setTransactions([]);
    if (keypair) {
      fetchBalance();
      fetchTransactions();
    }
  };

  const handleCreateWallet = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newMnemonic = generateMnemonic();
      setMnemonic(newMnemonic);
      const kp = await mnemonicToKeypair(newMnemonic);
      const privateKey = keypairToPrivateKey(kp);
      saveWallet(privateKey, password);
      setKeypair(kp);
      setSuccess('Wallet created! Save your recovery phrase securely.');
    } catch (e) {
      setError('Failed to create wallet: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let kp;
      if (importType === 'mnemonic') {
        if (!validateMnemonic(importValue.trim())) {
          throw new Error('Invalid mnemonic phrase');
        }
        kp = await mnemonicToKeypair(importValue.trim());
      } else {
        kp = privateKeyToKeypair(importValue.trim());
      }

      const privateKey = keypairToPrivateKey(kp);
      saveWallet(privateKey, password);
      setKeypair(kp);
      setShowImportModal(false);
      setImportValue('');
      setPassword('');
      setConfirmPassword('');
      setSuccess('Wallet imported successfully!');
    } catch (e) {
      setError('Failed to import wallet: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWallet = () => {
    setError('');
    const kp = loadWallet(password);
    if (kp) {
      setKeypair(kp);
      setShowUnlockModal(false);
      setPassword('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleSendSol = async () => {
    if (!isValidSolanaAddress(sendTo)) {
      setError('Invalid recipient address');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount');
      return;
    }

    if (amount > balance) {
      setError('Insufficient balance');
      return;
    }

    setSending(true);
    setError('');

    try {
      const signature = await sendSol(keypair, sendTo, amount);
      setSuccess(`Transaction sent! Signature: ${shortenAddress(signature, 8)}`);
      setShowSendModal(false);
      setSendTo('');
      setSendAmount('');
      fetchBalance();
      fetchTransactions();
    } catch (e) {
      setError('Transaction failed: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleAirdrop = async () => {
    if (network === 'mainnet') {
      setError('Airdrop not available on mainnet');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await requestAirdrop(keypair.publicKey.toString(), 1);
      setSuccess('Airdrop successful! 1 SOL added.');
      fetchBalance();
      fetchTransactions();
    } catch (e) {
      setError('Airdrop failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearWallet();
    setKeypair(null);
    setBalance(null);
    setTransactions([]);
    setMnemonic('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Pending';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getExplorerUrl = (signature) => {
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `https://explorer.solana.com/tx/${signature}${cluster}`;
  };

  const resetModals = () => {
    setShowCreateModal(false);
    setShowImportModal(false);
    setShowSendModal(false);
    setMnemonic('');
    setImportValue('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSendTo('');
    setSendAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solana Wallet</h1>
          <p className="text-gray-600">Manage your SOL and trade on Solana</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={network}
            onChange={(e) => handleNetworkChange(e.target.value)}
            className="rounded-lg border-gray-300 text-sm"
          >
            <option value="devnet">Devnet</option>
            <option value="testnet">Testnet</option>
            <option value="mainnet">Mainnet</option>
          </select>

          {keypair && (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-lg ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <div className="flex items-center gap-2">
            {error ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            <span>{error || success}</span>
          </div>
          <button
            onClick={() => { setError(''); setSuccess(''); }}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!keypair ? (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <WalletIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold">Get Started with Solana</h2>
            <p className="text-gray-600">
              Create a new wallet or import an existing one to start trading on Solana.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { resetModals(); setShowCreateModal(true); }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
                Create New Wallet
              </button>
              <button
                onClick={() => { resetModals(); setShowImportModal(true); }}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-5 h-5" />
                Import Existing Wallet
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-purple-200 text-sm">Total Balance</p>
                  <h2 className="text-4xl font-bold">
                    {balance !== null ? formatSol(balance) : '---'} SOL
                  </h2>
                </div>
                <button
                  onClick={() => { fetchBalance(); fetchTransactions(); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <span className="text-sm font-mono flex-1 truncate">
                  {keypair.publicKey.toString()}
                </span>
                <button
                  onClick={() => copyToClipboard(keypair.publicKey.toString())}
                  className="p-1.5 hover:bg-white/10 rounded"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-purple-700 rounded-lg hover:bg-purple-50"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
                {network !== 'mainnet' && (
                  <button
                    onClick={handleAirdrop}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 rounded-lg hover:bg-white/30"
                  >
                    <Droplets className="w-4 h-4" />
                    Airdrop
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.signature}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          tx.type === 'receive' ? 'bg-green-100 text-green-600' :
                          tx.type === 'send' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {tx.type === 'receive' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : tx.type === 'send' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-sm text-gray-500">{formatDate(tx.blockTime)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          tx.type === 'receive' ? 'text-green-600' :
                          tx.type === 'send' ? 'text-red-600' : ''
                        }`}>
                          {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{formatSol(tx.amount)} SOL
                        </p>
                        <a
                          href={getExplorerUrl(tx.signature)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline flex items-center justify-end gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Wallet Security</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Private Key</span>
                    <button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="text-sm text-purple-600 flex items-center gap-1"
                    >
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPrivateKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showPrivateKey && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-600 mb-2">Never share your private key!</p>
                      <code className="text-xs break-all">{keypairToPrivateKey(keypair)}</code>
                      <button
                        onClick={() => copyToClipboard(keypairToPrivateKey(keypair))}
                        className="mt-2 text-xs text-red-600 hover:underline"
                      >
                        Copy to clipboard
                      </button>
                    </div>
                  )}
                </div>

                {mnemonic && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Recovery Phrase</p>
                    <p className="text-xs text-yellow-600 mb-2">
                      Save this phrase securely. You'll need it to recover your wallet.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {mnemonic.split(' ').map((word, i) => (
                        <span key={i} className="text-xs bg-yellow-100 px-2 py-1 rounded">
                          {i + 1}. {word}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => copyToClipboard(mnemonic)}
                      className="mt-2 text-xs text-yellow-700 hover:underline"
                    >
                      Copy phrase
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Network Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Network</span>
                  <span className="font-medium capitalize">{network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RPC</span>
                  <span className="font-mono text-xs truncate max-w-[150px]">
                    {NETWORKS[network]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={resetModals}
        title="Create New Wallet"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border-gray-300"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border-gray-300"
              placeholder="Confirm your password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={resetModals}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWallet}
              disabled={loading || !password || !confirmPassword}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={resetModals}
        title="Import Wallet"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setImportType('mnemonic')}
              className={`flex-1 py-2 rounded-lg text-sm ${
                importType === 'mnemonic'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Recovery Phrase
            </button>
            <button
              onClick={() => setImportType('privateKey')}
              className={`flex-1 py-2 rounded-lg text-sm ${
                importType === 'privateKey'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Private Key
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {importType === 'mnemonic' ? '12-word Recovery Phrase' : 'Private Key (Base58)'}
            </label>
            <textarea
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              className="w-full rounded-lg border-gray-300 h-24"
              placeholder={importType === 'mnemonic' ? 'Enter your 12 words...' : 'Enter your private key...'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border-gray-300"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border-gray-300"
              placeholder="Confirm your password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={resetModals}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImportWallet}
              disabled={loading || !importValue || !password || !confirmPassword}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Wallet'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSendModal}
        onClose={resetModals}
        title="Send SOL"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              className="w-full rounded-lg border-gray-300 font-mono text-sm"
              placeholder="Enter Solana address..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (SOL)
            </label>
            <div className="relative">
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="w-full rounded-lg border-gray-300"
                placeholder="0.00"
                step="0.0001"
                min="0"
              />
              <button
                onClick={() => setSendAmount(balance ? (balance - 0.001).toFixed(4) : '0')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-600 hover:underline"
              >
                Max
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available: {balance !== null ? formatSol(balance) : '---'} SOL
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={resetModals}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendSol}
              disabled={sending || !sendTo || !sendAmount}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send SOL'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        title="Unlock Wallet"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-center text-gray-600">
            Enter your password to unlock your wallet.
          </p>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlockWallet()}
              className="w-full rounded-lg border-gray-300"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { clearWallet(); setShowUnlockModal(false); }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Wallet
            </button>
            <button
              onClick={handleUnlockWallet}
              disabled={!password}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Unlock
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Wallet;
