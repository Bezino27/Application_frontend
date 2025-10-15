#!/bin/bash
echo "🧹 Resetovanie React/Expo prostredia..."

# Zastavenie procesov
echo "⛔ Zastavujem bežiace procesy..."
killall -9 node 2>/dev/null
killall -9 watchman 2>/dev/null

# Vyčistenie dočasných súborov
echo "🧼 Odstraňujem cache a staré buildy..."
rm -rf node_modules .expo .expo-shared .cache package-lock.json
rm -rf $TMPDIR/metro*

# Vyčistenie npm cache
echo "🧽 Čistím npm cache..."
npm cache clean --force

# Znovu nainštalovanie závislostí
echo "📦 Inštalujem balíky nanovo..."
npm install

# Zvýšenie systémových limitov (pre istotu)
ulimit -n 8192
ulimit -u 2048

# Spustenie Expo s čistou cache
echo "🚀 Spúšťam Expo..."
npx expo start -c

echo "✅ Hotovo!"
