# Pindex

A mobile app for collecting and trading physical pins. Users can log their pin collections, mark pins as available for trading, and initiate digital trades with other users that represent real-life exchanges.

Built with Expo (React Native), NativeWind, and Supabase.

## Stack

- **Expo / React Native** — cross-platform mobile app
- **NativeWind** — Tailwind CSS styling for React Native
- **Supabase** — auth, database, storage

## Commands

```bash
npm install                  # Install dependencies
npx expo start               # Start the dev server
npx expo start --clear       # Start with cache cleared
npm run android              # Open on Android emulator
npm run ios                  # Open on iOS simulator
npm run web                  # Open in browser
npm run lint                 # Run linter
```

## Supabase

```bash
npx supabase db push                                              # Push migrations to remote
npx supabase gen types typescript --linked > types/supabase.ts   # Regenerate DB types
```
