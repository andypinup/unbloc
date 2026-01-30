import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import * as bip39 from 'bip39';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { derivePath } from 'ed25519-hd-key';

const STORAGE_KEY = 'solana_wallet_encrypted';
const NETWORK_KEY = 'solana_network';

const NETWORKS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com'
};

export const getNetwork = () => {
  return localStorage.getItem(NETWORK_KEY) || 'devnet';
};

export const setNetwork = (network) => {
  localStorage.setItem(NETWORK_KEY, network);
};

export const getConnection = () => {
  const network = getNetwork();
  return new Connection(NETWORKS[network], 'confirmed');
};

export const generateMnemonic = () => {
  return bip39.generateMnemonic(128);
};

export const validateMnemonic = (mnemonic) => {
  return bip39.validateMnemonic(mnemonic);
};

export const mnemonicToKeypair = async (mnemonic, accountIndex = 0) => {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const derivedSeed = derivePath(path, seed.toString('hex')).key;
  return Keypair.fromSeed(derivedSeed);
};

export const privateKeyToKeypair = (privateKey) => {
  try {
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch (e) {
    const uint8Array = new Uint8Array(JSON.parse(privateKey));
    return Keypair.fromSecretKey(uint8Array);
  }
};

export const keypairToPrivateKey = (keypair) => {
  return bs58.encode(keypair.secretKey);
};

const simpleEncrypt = (text, password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const key = encoder.encode(password.padEnd(32, '0').slice(0, 32));
  const encrypted = data.map((byte, i) => byte ^ key[i % key.length]);
  return btoa(String.fromCharCode(...encrypted));
};

const simpleDecrypt = (encryptedText, password) => {
  const encoder = new TextEncoder();
  const key = encoder.encode(password.padEnd(32, '0').slice(0, 32));
  const data = new Uint8Array(atob(encryptedText).split('').map(c => c.charCodeAt(0)));
  const decrypted = data.map((byte, i) => byte ^ key[i % key.length]);
  return new TextDecoder().decode(decrypted);
};

export const saveWallet = (privateKey, password) => {
  const encrypted = simpleEncrypt(privateKey, password);
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const loadWallet = (password) => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  try {
    const privateKey = simpleDecrypt(encrypted, password);
    return privateKeyToKeypair(privateKey);
  } catch (e) {
    return null;
  }
};

export const hasStoredWallet = () => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

export const clearWallet = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getBalance = async (publicKey) => {
  const connection = getConnection();
  const balance = await connection.getBalance(new PublicKey(publicKey));
  return balance / LAMPORTS_PER_SOL;
};

export const requestAirdrop = async (publicKey, amount = 1) => {
  const connection = getConnection();
  const network = getNetwork();

  if (network === 'mainnet') {
    throw new Error('Airdrop not available on mainnet');
  }

  const signature = await connection.requestAirdrop(
    new PublicKey(publicKey),
    amount * LAMPORTS_PER_SOL
  );

  await connection.confirmTransaction(signature);
  return signature;
};

export const sendSol = async (keypair, toAddress, amount) => {
  const connection = getConnection();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;

  transaction.sign(keypair);

  const signature = await connection.sendRawTransaction(transaction.serialize());

  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight
  });

  return signature;
};

export const getRecentTransactions = async (publicKey, limit = 10) => {
  const connection = getConnection();
  const pubKey = new PublicKey(publicKey);

  const signatures = await connection.getSignaturesForAddress(pubKey, { limit });

  const transactions = await Promise.all(
    signatures.map(async (sig) => {
      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });

        let type = 'unknown';
        let amount = 0;
        let otherParty = '';

        if (tx?.meta && tx.transaction?.message?.instructions) {
          const preBalances = tx.meta.preBalances;
          const postBalances = tx.meta.postBalances;
          const accountKeys = tx.transaction.message.accountKeys;

          const accountIndex = accountKeys.findIndex(
            (key) => key.pubkey.toString() === publicKey
          );

          if (accountIndex !== -1) {
            const balanceChange = postBalances[accountIndex] - preBalances[accountIndex];
            amount = Math.abs(balanceChange) / LAMPORTS_PER_SOL;
            type = balanceChange > 0 ? 'receive' : 'send';

            const otherIndex = type === 'send' ? 1 : 0;
            if (accountKeys[otherIndex]) {
              otherParty = accountKeys[otherIndex].pubkey.toString();
            }
          }
        }

        return {
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime,
          confirmationStatus: sig.confirmationStatus,
          err: sig.err,
          type,
          amount,
          otherParty
        };
      } catch (e) {
        return {
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime,
          confirmationStatus: sig.confirmationStatus,
          err: sig.err,
          type: 'unknown',
          amount: 0,
          otherParty: ''
        };
      }
    })
  );

  return transactions;
};

export const isValidSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const shortenAddress = (address, chars = 4) => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const formatSol = (amount, decimals = 4) => {
  return parseFloat(amount).toFixed(decimals);
};

export { NETWORKS, LAMPORTS_PER_SOL };
