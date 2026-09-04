#!/bin/bash
cd "$(dirname "$0")"
echo "𓆣 KUWAGATA PREMIUM CARD STUDIO v4.7.0 ローカル開発サーバー起動"
echo "👉 ブラウザで開く: http://localhost:8080"
python3 -m http.server 8080
