import '@ethersproject/shims';
import 'fast-text-encoding';
import 'react-native-get-random-values';

import {
    CryptoDigestAlgorithm,
    digest,
    getRandomValues,
    randomUUID,
} from 'expo-crypto';

type SupportedAlgorithm =
  | CryptoDigestAlgorithm.SHA1
  | CryptoDigestAlgorithm.SHA256
  | CryptoDigestAlgorithm.SHA384
  | CryptoDigestAlgorithm.SHA512;

const digestMap: Record<string, SupportedAlgorithm> = {
  'SHA-1': CryptoDigestAlgorithm.SHA1,
  'SHA1': CryptoDigestAlgorithm.SHA1,
  'SHA-256': CryptoDigestAlgorithm.SHA256,
  'SHA256': CryptoDigestAlgorithm.SHA256,
  'SHA-384': CryptoDigestAlgorithm.SHA384,
  'SHA384': CryptoDigestAlgorithm.SHA384,
  'SHA-512': CryptoDigestAlgorithm.SHA512,
  'SHA512': CryptoDigestAlgorithm.SHA512,
};

const toUint8Array = (data: BufferSource): Uint8Array => {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(
      data.buffer as ArrayBuffer,
      data.byteOffset,
      data.byteLength,
    );
  }

  throw new TypeError('Unsupported BufferSource provided to crypto.subtle.digest');
};

const unsupported = (method: string) => () => {
  throw new Error(`crypto.subtle.${method} is not implemented in this environment`);
};

const ensureCrypto = () => {
  if (!globalThis.crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.crypto = {} as any;
  }

  if (typeof globalThis.crypto.getRandomValues !== 'function') {
    globalThis.crypto.getRandomValues = getRandomValues as Crypto['getRandomValues'];
  }

  if (typeof globalThis.crypto.randomUUID !== 'function') {
    globalThis.crypto.randomUUID = randomUUID as Crypto['randomUUID'];
  }

  if (!globalThis.crypto.subtle) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis.crypto as any).subtle = {
      digest: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
        const algoName =
          typeof algorithm === 'string' ? algorithm : algorithm?.name ?? 'SHA-256';
        const mapped = digestMap[algoName.toUpperCase()];

        if (!mapped) {
          throw new Error(`Unsupported digest algorithm: ${algoName}`);
        }

        const input = toUint8Array(data) as Uint8Array<ArrayBuffer>;
        return digest(mapped, input);
      },
      encrypt: unsupported('encrypt'),
      decrypt: unsupported('decrypt'),
      sign: unsupported('sign'),
      verify: unsupported('verify'),
      deriveKey: unsupported('deriveKey'),
      deriveBits: unsupported('deriveBits'),
      generateKey: unsupported('generateKey'),
      importKey: unsupported('importKey'),
      exportKey: unsupported('exportKey'),
      wrapKey: unsupported('wrapKey'),
      unwrapKey: unsupported('unwrapKey'),
    } as SubtleCrypto;
  }
};

ensureCrypto();

