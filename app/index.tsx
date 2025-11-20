import '@/polyfills';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import type { LinkedAccount } from '@privy-io/api-types';
import {
    hasError,
    isCreating,
    isDisconnected,
    isNotCreated,
    needsRecovery,
    useEmbeddedSolanaWallet,
    usePrivy,
} from '@privy-io/expo';
import { useLogin } from '@privy-io/expo/ui';

const SOLANA_RPC = 'https://api.devnet.solana.com';
const LAMPORTS_PER_SOL = 1_000_000_000;

export default function HomeScreen() {
  const { user, isReady, logout } = usePrivy();
  const solanaWallet = useEmbeddedSolanaWallet();
  const { login } = useLogin();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLaunchingLogin, setIsLaunchingLogin] = useState(false);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const primaryWallet = solanaWallet.wallets?.[0] ?? null;

  const emailAccount = useMemo(() => {
    if (!user) {
      return null;
    }

    return (
      user.linked_accounts.find(
        (account): account is LinkedAccount.LinkedAccountEmail => account.type === 'email',
      ) ?? null
    );
  }, [user]);

  const solanaStatus = solanaWallet.status;

  const formattedBalance = useMemo(() => {
    if (balanceLamports == null) {
      return '—';
    }
    return (balanceLamports / LAMPORTS_PER_SOL).toFixed(4);
  }, [balanceLamports]);

  const resetBalanceUi = useCallback(() => {
    setBalanceLamports(null);
    setBalanceError(null);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!primaryWallet?.address) {
      resetBalanceUi();
      return;
    }

    setIsRefreshingBalance(true);
    setBalanceError(null);

    try {
      const response = await fetch(SOLANA_RPC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'getBalance',
          params: [primaryWallet.address],
        }),
      });

      const payload = (await response.json()) as { result?: { value?: number } };

      if (payload?.result?.value == null) {
        throw new Error('Unable to fetch balance');
      }

      setBalanceLamports(payload.result.value);
    } catch (error) {
      console.error('Failed to fetch Solana balance', error);
      setBalanceError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [primaryWallet?.address, resetBalanceUi]);

  useEffect(() => {
    resetBalanceUi();
    if (primaryWallet?.address) {
      refreshBalance();
    }
  }, [primaryWallet?.address, refreshBalance, resetBalanceUi]);

  const handlePrivyLogin = useCallback(async () => {
    setIsLaunchingLogin(true);
    setStatusMessage(null);
    try {
      const result = await login({
        loginMethods: ['email'],
        appearance: {
          logo: 'https://privy-public.s3.amazonaws.com/privy-logo-horizontal.png',
        },
      });
      setStatusMessage(`Logged in as ${result.user.id}`);
    } catch (error) {
      console.error('Privy login failed', error);
      setStatusMessage(error instanceof Error ? error.message : 'Login cancelled.');
    } finally {
      setIsLaunchingLogin(false);
    }
  }, [login]);

  const handleCreateWallet = useCallback(async () => {
    if (!solanaWallet.create) {
      return;
    }

    try {
      await solanaWallet.create();
      setStatusMessage('Solana wallet ready.');
    } catch (error) {
      console.error('create solana wallet failed', error);
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create wallet.');
    }
  }, [solanaWallet]);

  const handleRecoverWallet = useCallback(async () => {
    if (!solanaWallet.recover) {
      return;
    }
    try {
      await solanaWallet.recover();
      setStatusMessage('Recovery complete.');
    } catch (error) {
      console.error('recover solana wallet failed', error);
      setStatusMessage(error instanceof Error ? error.message : 'Failed to recover wallet.');
    }
  }, [solanaWallet]);

  const handleLogout = useCallback(async () => {
    await logout();
    setStatusMessage('Logged out.');
    resetBalanceUi();
  }, [logout, resetBalanceUi]);

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.centeredText}>Booting Privy…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>React Native + Privy</Text>
        <Text style={styles.value}>
          This template wires up Privy&apos;s UI Kit with Solana embedded wallets so you can ship a
          login + wallet experience without scaffolding.
        </Text>
        {!user ? (
          <>
            <TouchableOpacity
              style={[styles.button, isLaunchingLogin && styles.buttonDisabled]}
              disabled={isLaunchingLogin}
              onPress={handlePrivyLogin}>
              <Text style={styles.buttonText}>
                {isLaunchingLogin ? 'Connecting…' : 'Continue with Privy'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>What happens?</Text>
            <Text style={styles.value}>
              Users authenticate via Privy (email by default), then a Solana wallet is created and
              attached to the session.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.subtitle}>Session</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
                <Text style={styles.secondaryButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value}>{user.id}</Text>
            {emailAccount && (
              <>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{emailAccount.address}</Text>
              </>
            )}
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>{new Date(user.created_at).toLocaleString()}</Text>
          </>
        )}
        {statusMessage && <Text style={styles.feedback}>{statusMessage}</Text>}
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>Embedded Solana wallet</Text>
          <Text style={styles.pill}>{solanaStatus}</Text>
        </View>
        {hasError(solanaWallet) && (
          <Text style={styles.errorText}>Wallet error: {solanaWallet.error}</Text>
        )}
        {primaryWallet ? (
          <>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{primaryWallet.address}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Balance (devnet)</Text>
              <TouchableOpacity
                onPress={refreshBalance}
                style={[styles.secondaryButton, styles.refreshButton]}
                disabled={isRefreshingBalance}>
                <Text style={styles.secondaryButtonText}>
                  {isRefreshingBalance ? 'Refreshing…' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.value}>
              {formattedBalance} SOL {balanceError ? `(${balanceError})` : ''}
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                Linking.openURL(
                  `https://explorer.solana.com/address/${primaryWallet.address}?cluster=devnet`,
                )
              }>
              <Text style={styles.secondaryButtonText}>Open in explorer</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.value}>No wallet yet.</Text>
        )}
        <View style={styles.walletActions}>
          {(isNotCreated(solanaWallet) || isDisconnected(solanaWallet)) && (
            <TouchableOpacity style={styles.button} onPress={handleCreateWallet}>
              <Text style={styles.buttonText}>Create wallet</Text>
            </TouchableOpacity>
          )}
          {needsRecovery(solanaWallet) && (
            <TouchableOpacity style={styles.button} onPress={handleRecoverWallet}>
              <Text style={styles.buttonText}>Recover wallet</Text>
            </TouchableOpacity>
          )}
          {isCreating(solanaWallet) && <Text style={styles.label}>Provisioning wallet…</Text>}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 24,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  button: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  secondaryButtonText: {
    color: '#38bdf8',
    fontWeight: '500',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#F8FAFC',
  },
  feedback: {
    color: '#FDE68A',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  centeredText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  pill: {
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  errorText: {
    color: '#FCA5A5',
  },
  refreshButton: {
    paddingVertical: 4,
    borderRadius: 8,
  },
});

