# React Native + Privy Starter

Single-screen Expo template that wires Privy’s UI Kit to a Solana embedded wallet. Launch Privy’s hosted auth (email by default), auto-provision an embedded wallet, inspect balances, and expose explorer links—all without touching custom OTP or modal code.

https://github.com/user-attachments/assets/privy-template-preview.gif

## What’s inside

- Expo Router + React Native 0.81
- Privy React Native SDK (`@privy-io/expo`, `@privy-io/react-auth`)
- Privy UI Kit (`@privy-io/expo/ui`) mounted globally
- Solana devnet balance fetcher + explorer links
- Polyfilled Web Crypto (`expo-crypto`, `fast-text-encoding`, `@ethersproject/shims`) so Privy works in Expo Go/dev clients

## Running locally

```bash
# start from this template via Expo CLI
npx create-expo-app --template https://github.com/Trymbakmahant/privy-expo-template my-privy-app

# or clone and run manually
npm install
cp .env.example .env    # fill in EXPO_PUBLIC_PRIVY_APP_ID (+ optional CLIENT_ID)
npx expo start
```

Scan the QR with Expo Go or run on your simulator of choice. The home screen is the entire experience—tap “Continue with Privy” to trigger the hosted login UI and watch a Solana wallet appear once auth completes.

## Environment variables

| Name                         | Description                                |
| ---------------------------- | ------------------------------------------ |
| `EXPO_PUBLIC_PRIVY_APP_ID`   | Required. Found in the Privy dashboard.    |
| `EXPO_PUBLIC_PRIVY_CLIENT_ID` | Optional. Needed if you configured clients. |

## Customizing

- **Login methods** – update the `loginMethods` array inside `app/index.tsx` (`useLogin` call) to add SMS, OAuth providers, etc.
- **Solana RPC** – change `SOLANA_RPC` if you want mainnet or your own RPC provider.
- **Styling** – everything is in `app/index.tsx`. Swap fonts/colors, drop in your own branding, or extract components.
- **Privy config** – tune `privyConfig` in `app/_layout.tsx` (e.g., disable Ethereum wallets, tweak embedded wallet behavior).

## Deploying / templating

This repo is ready to publish as a template:

1. Push to GitHub/GitLab.
2. Point users at the README (copy `.env.example`, run `npm install`, etc.).
3. Optionally add an Expo Dev Client build if you need device features beyond Expo Go.

## Support

- Privy docs: https://docs.privy.io
- Privy Discord: https://discord.gg/privy
- Expo docs: https://docs.expo.dev

Feel free to fork, remix, and link back if you ship something cool.#
