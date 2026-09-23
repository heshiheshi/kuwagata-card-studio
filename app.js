/**
 * KUWAGATA PREMIUM CARD STUDIO - APPLICATION ENGINE (v4.34.0 Extended Font & Typography Scale Edition)
 * Zero-Limit StorageVault (IndexedDB), Multi-Layer Compositor, Deep Diagnostic Logging & Orthodox Sync
 */

(function () {
  'use strict';

  const APP_VERSION = 'v4.34.0';
  const VALID_PASSCODES = ['lojing2026', 'kuwagata2026', '7777'];

  // 🌟 localhost/本番環境の自動判定（localhost時は本番Cloudflare KVへ直結）
  const IS_LOCAL_DEV = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const CLOUD_SYNC_ENDPOINT = IS_LOCAL_DEV
    ? 'https://kuwagata-card-studio.pages.dev/api/sync'
    : '/api/sync';

  // 🛡️ 端末固定の永久キー金庫（アップデートでも絶対に消えないキー名）
  const VAULT_KEYS = {
    FREE_API_KEY: 'kuwagata_vault_free_api_key',
    PAID_API_KEY: 'kuwagata_vault_paid_api_key',
    ACTIVE_KEY_MODE: 'kuwagata_vault_active_key_mode',
    AUTH_PASSED: 'kuwagata_vault_auth_passed'
  };

  // --- 💾 大容量ローカルデータベース（StorageVault - IndexedDB） ---
  const DB_NAME = 'KuwagataStudioDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'studio_vault';

  const StorageVault = {
    db: null,

    async open() {
      if (this.db) return this.db;
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          Logger.warn('IndexedDB非対応ブラウザです。LocalStorageをフォールバック使用します。');
          resolve(null);
          return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };
        request.onerror = (e) => {
          Logger.error('IndexedDB open error', e.target.error);
          resolve(null);
        };
      });
    },

    async set(key, value) {
      try {
        const db = await this.open();
        if (!db) {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        }
        return new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(value, key);
          req.onsuccess = () => resolve(true);
          req.onerror = (e) => {
            Logger.error('IndexedDB put error', e.target.error);
            resolve(false);
          };
        });
      } catch (e) {
        Logger.error('StorageVault.set error', e.message);
        return false;
      }
    },

    async get(key) {
      try {
        const db = await this.open();
        if (!db) {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : null;
        }
        return new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = (e) => {
            if (e.target.result !== undefined && e.target.result !== null) {
              resolve(e.target.result);
            } else {
              // LocalStorageからの移行フォールバック
              const localVal = localStorage.getItem(key);
              resolve(localVal ? JSON.parse(localVal) : null);
            }
          };
          req.onerror = (e) => {
            Logger.error('IndexedDB get error', e.target.error);
            const localVal = localStorage.getItem(key);
            resolve(localVal ? JSON.parse(localVal) : null);
          };
        });
      } catch (e) {
        Logger.error('StorageVault.get error', e.message);
        return null;
      }
    }
  };

  // --- 🛠️ 超詳細プログラム診断ロガー (Deep Diagnostic Logger) ---
  const Logger = {
    logs: [],
    maxLogs: 300,

    add(type, msg, rawData = null) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      
      const entry = {
        iso: now.toISOString(),
        time: timeStr,
        type: type,
        msg: msg,
        rawData: rawData
      };
      this.logs.unshift(entry);
      if (this.logs.length > this.maxLogs) this.logs.pop();

      this.updateUI();
      console.log(`[${entry.time}] [${type.toUpperCase()}] ${msg}`, rawData || '');
    },

    info(msg, data) { this.add('info', msg, data); },
    api(msg, data) { this.add('api', msg, data); },
    sync(msg, data) { this.add('sync', msg, data); },
    storage(msg, data) { this.add('storage', msg, data); },
    render(msg, data) { this.add('render', msg, data); },
    success(msg, data) { this.add('success', msg, data); },
    warn(msg, data) { this.add('warn', msg, data); },
    error(msg, data) { this.add('error', msg, data); },
    trace(msg, data) { this.add('trace', msg, data); },

    async updateUI() {
      const pill = document.getElementById('logCountPill');
      const tag = document.getElementById('logModalCount');
      const terminal = document.getElementById('logTerminal');
      const usageEl = document.getElementById('logStorageUsageText');

      if (pill) pill.textContent = this.logs.length;
      if (tag) tag.textContent = `${this.logs.length} 件`;

      if (usageEl) {
        if (navigator.storage && navigator.storage.estimate) {
          try {
            const est = await navigator.storage.estimate();
            const usedMB = (est.usage / (1024 * 1024)).toFixed(2);
            usageEl.textContent = `ストレージ: IndexedDB大容量保管中 (${usedMB} MB 使用 / 上限数GB)`;
          } catch (e) {
            usageEl.textContent = 'ストレージ: IndexedDB大容量保管中 (数GB対応)';
          }
        }
      }

      if (terminal) {
        terminal.innerHTML = this.logs.map(log => {
          let extra = '';
          if (log.rawData) {
            const rawStr = typeof log.rawData === 'object' ? JSON.stringify(log.rawData, null, 2) : String(log.rawData);
            extra = `<pre style="margin-top:4px; padding:6px; background:#000; color:#81c784; font-size:10px; border-radius:4px; overflow-x:auto; line-height:1.3;">${this.escapeHtml(rawStr)}</pre>`;
          }
          return `
            <div class="log-entry" style="font-size:11px; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span class="log-time" style="color:#888;">[${log.time}]</span>
              <span class="log-tag ${log.type}" style="font-weight:700; padding:1px 4px; border-radius:2px;">${log.type.toUpperCase()}</span>
              <div class="log-msg" style="margin-top:2px;">
                <span style="color:#eee;">${this.escapeHtml(log.msg)}</span>
                ${extra}
              </div>
            </div>
          `;
        }).join('');
      }
    },

    clear() {
      this.logs = [];
      this.updateUI();
      this.info('ログを消去しました。');
    },

    getAllText() {
      return this.logs.map(l => {
        let line = `[${l.iso}] [${l.type.toUpperCase()}] ${l.msg}`;
        if (l.rawData) {
          line += '\n' + (typeof l.rawData === 'object' ? JSON.stringify(l.rawData, null, 2) : String(l.rawData));
        }
        return line;
      }).reverse().join('\n');
    },

    escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  };

  // --- デフォルト カテゴリ ＆ 単語 ---
  const DEFAULT_CATEGORIES = {
    prefix: '目的・指示文',
    texture: '質感・ベース',
    color: '色彩・水彩',
    decor: '装飾・エフェクト',
    quality: '構図・品質',
    custom: '自作単語・登録'
  };

  const DEFAULT_CHIPS = [
    { id: 'c_pre_1', category: 'prefix', text: '最高峰クワガタの血統証明・トレーディングカード用の純粋な背景グラフィックテクスチャを生成してください。', isVisible: true, isCustom: false },
    { id: 'c_pre_2', category: 'prefix', text: '高級コレクターズカードの背景テクスチャを作成してください。', isVisible: true, isCustom: false },
    { id: 'c_tex_1', category: 'texture', text: '和紙の質感', isVisible: true, isCustom: false },
    { id: 'c_tex_2', category: 'texture', text: '上質な生成り和紙', isVisible: true, isCustom: false },
    { id: 'c_tex_3', category: 'texture', text: '漆黒の重厚な背景', isVisible: true, isCustom: false },
    { id: 'c_tex_4', category: 'texture', text: '黒曜石の鉱物テクスチャ', isVisible: true, isCustom: false },
    { id: 'c_col_1', category: 'color', text: '中央に透明感のある翡翠色・深緑色の水彩シェイプ', isVisible: true, isCustom: false },
    { id: 'c_col_2', category: 'color', text: '中央に深紅・ルビー色のクリスタル水彩グラデーション', isVisible: true, isCustom: false },
    { id: 'c_col_3', category: 'color', text: '黄金の木漏れ日と光彩グラデーション', isVisible: true, isCustom: false },
    { id: 'c_dec_1', category: 'decor', text: '細やかな金箔の散らし', isVisible: true, isCustom: false },
    { id: 'c_dec_2', category: 'decor', text: '優美な蒔絵風ゴールドの光沢', isVisible: true, isCustom: false },
    { id: 'c_dec_3', category: 'decor', text: '外周の繊細な光沢エッジ', isVisible: true, isCustom: false },
    { id: 'c_qua_1', category: 'quality', text: '文字配置用の中央クリーン構図', isVisible: true, isCustom: false },
    { id: 'c_qua_2', category: 'quality', text: '文字やロゴなどのテキストは一切描かないでください（文字なし、背景のみ）', isVisible: true, isCustom: false },
    { id: 'c_qua_3', category: 'quality', text: '最高峰コレクターズ品質、8K高精細', isVisible: true, isCustom: false }
  ];

  // --- 🌟 状態管理 (State) ---
  const state = {
    freeApiKey: '',
    paidApiKey: '',
    activeKeyMode: 'free',

    localLastModifiedAt: 0,
    deletedCardIds: new Set(),
    deletedChipIds: new Set(),

    aspectRatio: '5:7',
    aiAspectRatio: '3:4',
    canvasWidth: 1500,
    canvasHeight: 2100,

    // 📐 印刷キャリブレーション & 安全枠ガイド (v4.15.0)
    showCalibrationOverlay: false, // 測定スケール透かし重ね合わせ
    showSafetyGuide: false,
    safetyMargin: 3, // % (0〜15%, 5:7標準は3%)
    exportWithGuide: false, // エクスポート時にガイド線・スケールを焼き込むか否か

    aiPrompt: '',
    categories: { ...DEFAULT_CATEGORIES },
    chips: [...DEFAULT_CHIPS],
    selectedChipIds: new Set(['c_pre_1', 'c_tex_1', 'c_col_1', 'c_dec_1', 'c_qua_1', 'c_qua_2', 'c_qua_3']),

    cardArchive: [],
    lastExtractedPrompt: null,
    lastCleanBgUrl: null,

    // 🎨 完全独立マルチレイヤー構造
    layers: {
      bg: {
        src: 'assets/bg_default.jpg',
        brightness: 100
      },
      brand: {
        text: 'LOJING',
        redInitial: true,
        aiGraphicDataUrl: null,
        x: 0,
        y: 20,
        scale: 100,
        opacity: 100,
        color: 'gold',
        shadow: false,
        glow: false,
        glowBlur: 14
      },
      kanji: {
        text: '蒼',
        font: "'Hiragino Mincho ProN', 'YuMincho', serif",
        aiGraphicDataUrl: null,
        x: 0,
        y: 44,
        scale: 100,
        opacity: 100,
        color: '#111111',
        shadow: false,
        glow: false,
        glowBlur: 14
      },
      romaji: {
        text: 'AOI',
        font: "'Cinzel', serif",
        aiGraphicDataUrl: null,
        x: 0,
        y: 68,
        scale: 100,
        opacity: 100,
        color: 'gold',
        shadow: false,
        glow: false,
        glowBlur: 14
      },
      specs: {
        ownerLabel: {
          text: 'Owner',
          font: "'Cinzel', serif",
          size: 36,
          y: 74,
          x: 0,
          color: '#222222',
          shadow: false,
          glow: false,
          glowBlur: 14
        },
        owner: {
          label: 'Owner',
          text: '佃 宗行 様',
          font: "'Hiragino Mincho ProN', serif",
          size: 62,
          y: 78,
          x: 0,
          color: '#111111',
          shadow: false,
          glow: false,
          glowBlur: 14
        },
        serial: {
          text: 'NO.AS-05',
          font: "'Cinzel', serif",
          size: 38,
          y: 83,
          x: 0,
          color: '#2a2a2a',
          shadow: false,
          glow: false,
          glowBlur: 14
        },
        size: {
          text: '♂77mm',
          font: "'Hiragino Mincho ProN', serif",
          size: 58,
          y: 88,
          x: 0,
          color: '#111111',
          shadow: false,
          glow: false,
          glowBlur: 14
        },
        extra: {
          text: '',
          font: "'Hiragino Mincho ProN', serif",
          size: 32,
          y: 93,
          x: 0,
          color: '#444444',
          shadow: false,
          glow: false,
          glowBlur: 14
        }
      }
    }
  };

  let loadedBgImg = null;
  let loadedBrandImg = null;
  let loadedKanjiImg = null;
  let loadedRomajiImg = null;
  let isRendering = false;

  // DOM 要素
  const canvas = document.getElementById('cardCanvas');
  const ctx = canvas.getContext('2d');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const ratioBadge = document.getElementById('ratioBadge');
  const resBadge = document.getElementById('resBadge');
  const apiKeyModal = document.getElementById('apiKeyModal');
  const backupModal = document.getElementById('backupModal');
  const imageSaveModal = document.getElementById('imageSaveModal');
  const freeApiKeyInput = document.getElementById('freeApiKeyInput');
  const paidApiKeyInput = document.getElementById('paidApiKeyInput');
  const btnQuickToggleKey = document.getElementById('btnQuickToggleKey');
  const keyModeLabel = document.getElementById('keyModeLabel');
  const logModal = document.getElementById('logModal');
  const dictManagerModal = document.getElementById('dictManagerModal');
  const aiStatusMsg = document.getElementById('aiStatusMsg');
  const aiPromptInput = document.getElementById('aiPromptInput');
  const archiveGrid = document.getElementById('archiveGrid');
  const archiveCountTag = document.getElementById('archiveCountTag');
  const dynamicChipGroupsContainer = document.getElementById('dynamicChipGroupsContainer');

  // --- 🛡️ 永久APIキー金庫管理 & マスキング/診断 ---
  function maskApiKey(key) {
    if (!key) return '(未設定)';
    const clean = String(key).trim();
    if (clean.length <= 8) return clean;
    return `${clean.slice(0, 6)}...${clean.slice(-4)} (${clean.length}文字)`;
  }

  function getEffectiveApiKeyInfo(purpose = 'any') {
    let key = '';
    let slot = '';

    // 🌟 ユーザーの明示的なモード選択（activeKeyMode: 'free' または 'paid'）を絶対最優先！
    // スロット1（無料キー）でもスロット2（有料キー）でも、ユーザーが選択したキーで全機能（背景生成・文字生成・Vision）を実行
    if (state.activeKeyMode === 'paid') {
      if (state.paidApiKey) {
        key = state.paidApiKey;
        slot = 'スロット2 (有料キー)';
      } else if (state.freeApiKey) {
        key = state.freeApiKey;
        slot = 'スロット1 (無料キー - スロット2未設定フォールバック)';
      } else {
        slot = '(未設定)';
      }
    } else {
      // デフォルト: 無料キーモード（スロット1を最優先使用）
      if (state.freeApiKey) {
        key = state.freeApiKey;
        slot = 'スロット1 (無料キー)';
      } else if (state.paidApiKey) {
        key = state.paidApiKey;
        slot = 'スロット2 (有料キー - スロット1未設定フォールバック)';
      } else {
        slot = '(未設定)';
      }
    }

    return {
      key: (key || '').trim(),
      slot: slot,
      masked: maskApiKey(key),
      slot1_masked: maskApiKey(state.freeApiKey),
      slot2_masked: maskApiKey(state.paidApiKey),
      activeMode: state.activeKeyMode === 'paid' ? '有料キー' : '無料キー'
    };
  }

  function getEffectiveApiKey(purpose = 'any') {
    return getEffectiveApiKeyInfo(purpose).key;
  }

  function loadApiKeyVault() {
    try {
      let free = localStorage.getItem(VAULT_KEYS.FREE_API_KEY) || '';
      let paid = localStorage.getItem(VAULT_KEYS.PAID_API_KEY) || '';
      let mode = localStorage.getItem(VAULT_KEYS.ACTIVE_KEY_MODE) || 'free';

      if (!free) {
        for (let i = 35; i >= 20; i--) {
          const old = localStorage.getItem(`kuwagata_free_api_key_v${i}`) || localStorage.getItem('kuwagata_gemini_api_key');
          if (old) { free = old; break; }
        }
      }
      if (!paid) {
        for (let i = 35; i >= 20; i--) {
          const old = localStorage.getItem(`kuwagata_paid_api_key_v${i}`);
          if (old) { paid = old; break; }
        }
      }

      state.freeApiKey = free;
      state.paidApiKey = paid;
      state.activeKeyMode = mode;

      saveApiKeyVault();
      if (free || paid) {
        Logger.info('🔑 端末内永久キー金庫からAPIキーをロードしました。', {
          slot1_freeKey: maskApiKey(free),
          slot2_paidKey: maskApiKey(paid),
          activeMode: mode === 'paid' ? '有料キー' : '無料キー'
        });
      } else {
        Logger.warn('⚠️ 端末内永久キー金庫にAPIキーが未設定です。');
      }
    } catch (e) {
      Logger.warn('Key vault load warning', e.message);
    }
  }

  function saveApiKeyVault() {
    try {
      localStorage.setItem(VAULT_KEYS.FREE_API_KEY, state.freeApiKey || '');
      localStorage.setItem(VAULT_KEYS.PAID_API_KEY, state.paidApiKey || '');
      localStorage.setItem(VAULT_KEYS.ACTIVE_KEY_MODE, state.activeKeyMode || 'free');
    } catch (e) {
      Logger.warn('Key vault save warning', e.message);
    }
  }

  // --- ☁️ 真の王道・分散クラウド同期エンジン (誤上書き防止＆直結＆タイムアウト保護) ---
  const CloudSyncManager = {
    isSyncing: false,
    hasPendingChanges: false,
    hasCompletedInitialPull: false,

    init() {
      this.updateIndicator('online', '自動同期稼働中');
      Logger.info(`☁️ クラウド同期接続先: ${CLOUD_SYNC_ENDPOINT} (${IS_LOCAL_DEV ? 'ローカル開発直結モード' : '本番モード'})`);

      // 🌟 非同期で初回クラウド確認（UI初期化を絶対にブロックしない）
      this.checkAndPullFromCloud(true).finally(() => {
        this.hasCompletedInitialPull = true;
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          Logger.trace('ライフサイクル: 画面復帰検知 ➔ クラウド変更確認');
          this.checkAndPullFromCloud(true);
        }
      });
      window.addEventListener('focus', () => {
        Logger.trace('ライフサイクル: ウィンドウフォーカス検知 ➔ クラウド変更確認');
        this.checkAndPullFromCloud(true);
      });

      window.addEventListener('online', () => {
        Logger.info('📶 インターネット接続が復旧しました。未送信データを同期します。');
        this.pushToCloud(true);
      });
      window.addEventListener('offline', () => {
        Logger.warn('📶 端末がオフラインになりました。IndexedDBに安全保持中。');
        this.updateIndicator('pending', 'オフライン（IndexedDB保持中）');
      });

      setInterval(() => {
        if (!this.isSyncing) {
          this.checkAndPullFromCloud(true);
        }
      }, 20000);
    },

    getSanitizedPayload() {
      return {
        studio: 'KUWAGATA_PREMIUM_STUDIO',
        version: APP_VERSION,
        updatedAt: state.localLastModifiedAt || Date.now(),
        deletedCardIds: Array.from(state.deletedCardIds),
        deletedChipIds: Array.from(state.deletedChipIds),
        categories: state.categories,
        chips: state.chips,
        selectedChipIds: Array.from(state.selectedChipIds),
        cardArchive: state.cardArchive
      };
    },

    // 🌟 操作時即時同期（※初回プル完了前や、初期未変更時の空送信は完全ブロック）
    async pushToCloud(silent = true, isExplicitForce = false) {
      if (!isExplicitForce) {
        if (!this.hasCompletedInitialPull) {
          Logger.warn('[SYNC_PUSH_GUARD] 初回クラウド確認が未完了のため送信を保留しました。');
          return;
        }
        if (state.cardArchive.length === 0 && state.localLastModifiedAt === 0) {
          Logger.warn('[SYNC_PUSH_GUARD] 初期状態（0件）のためクラウド上書きを防止しました。');
          return;
        }
        if (this.isSyncing) {
          this.hasPendingChanges = true;
          Logger.trace('同期中につき送信キューに保留しました。');
          return;
        }
      }

      this.isSyncing = true;
      this.updateIndicator('syncing', 'クラウドへ送信中...');

      state.localLastModifiedAt = Date.now();
      await StorageVault.set('kuwagata_local_last_modified_v4', state.localLastModifiedAt);

      const payload = this.getSanitizedPayload();
      const payloadJson = JSON.stringify(payload);
      const sizeKB = Math.round(payloadJson.length / 1024);

      Logger.sync(`[SYNC_PUSH] クラウド送信開始 (Cards: ${payload.cardArchive.length}件, Chips: ${payload.chips.length}件, Payload: ${sizeKB}KB)`);

      try {
        const timeoutMs = Math.max(35000, sizeKB * 15);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const resp = await fetch(CLOUD_SYNC_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadJson,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const respData = await resp.json().catch(() => ({}));
          this.updateIndicator('online', `同期完了 (${this.formatTime(new Date())})`);
          Logger.success(`[SYNC_PUSH_SUCCESS] クラウド送信完了 (HTTP ${resp.status}, Payload: ${sizeKB}KB)`);
          this.hasPendingChanges = false;
          if (!silent) {
            alert(`🎉 Cloudflare KV へ安全に保存されました！\n\n・単語辞書: ${payload.chips.length} 件\n・非破壊カード履歴: ${payload.cardArchive.length} 件 (${sizeKB} KB)`);
          }
        } else {
          throw new Error(`HTTP ${resp.status}`);
        }
      } catch (err) {
        this.hasPendingChanges = true;
        this.updateIndicator('error', '通信待機中（次回自動再送）');
        Logger.error('[SYNC_PUSH_ERROR] クラウド送信失敗', err.message);
        if (!silent) {
          alert('クラウド送信エラー: ' + err.message);
        }
      } finally {
        this.isSyncing = false;
        if (this.hasPendingChanges && !isExplicitForce) {
          this.hasPendingChanges = false;
          setTimeout(() => this.pushToCloud(true), 3000);
        }
      }
    },

    // 🌟 定期確認＆自動マージ（※端末が未初期化またはクラウドが新しい時は100%取り込み）
    async checkAndPullFromCloud(silent = true) {
      if (this.isSyncing || this.hasPendingChanges) return;
      this.isSyncing = true;

      Logger.trace(`[SYNC_CHECK] クラウド更新確認開始 (LocalTime: ${state.localLastModifiedAt})`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const resp = await fetch(CLOUD_SYNC_ENDPOINT, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const cloudData = await resp.json();
          if (cloudData && (cloudData.studio === 'KUWAGATA_PREMIUM_STUDIO' || Array.isArray(cloudData.cardArchive))) {
            const cloudTime = cloudData.updatedAt || 0;
            const deltaMs = cloudTime - state.localLastModifiedAt;

            Logger.trace(`[SYNC_CHECK_RESP] CloudTime: ${cloudTime}, LocalTime: ${state.localLastModifiedAt}, Delta: ${deltaMs}ms, CloudCards: ${cloudData.cardArchive?.length || 0}`);

            // ローカルが初期状態（0）またはクラウドの方が新しい場合、安全に取り込み
            const shouldAdopt = (state.localLastModifiedAt === 0 && (cloudData.cardArchive?.length > 0 || cloudData.chips?.length > 0)) || (cloudTime > state.localLastModifiedAt);

            if (shouldAdopt) {
              Logger.sync(`[SYNC_MERGE] クラウド側の最新データを取り込み・マージします (CloudCards: ${cloudData.cardArchive?.length || 0}件)`);
              this.updateIndicator('syncing', 'クラウドの最新を取り込み中...');

              await this.applyCloudData(cloudData);

              state.localLastModifiedAt = cloudTime || Date.now();
              await StorageVault.set('kuwagata_local_last_modified_v4', state.localLastModifiedAt);

              await saveState(false);
              renderDynamicChipGroups();
              updateCombinedPrompt();
              renderArchiveGrid();

              this.updateIndicator('online', `同期完了 (${this.formatTime(new Date())})`);
              Logger.success('[SYNC_MERGE_SUCCESS] クラウドとのスマートマージ完了');
              if (!silent) {
                alert('🎉 クラウドから最新データを正常に取り込みました！');
              }
            } else {
              this.updateIndicator('online', `同期完了 (${this.formatTime(new Date())})`);
              Logger.trace('[SYNC_CHECK_UPTODATE] 端末データは最新です（上書きスキップ）');
            }
          }
        }
      } catch (err) {
        this.updateIndicator('online', '自動同期稼働中');
        Logger.warn('[SYNC_CHECK_WARN] 定期確認スキップ', err.message);
      } finally {
        this.isSyncing = false;
        this.hasCompletedInitialPull = true;
      }
    },

    // 🌟 強制取得（Force Pull: ボタン押下時は無条件で最新化）
    async forcePullFromCloud() {
      this.isSyncing = true;
      this.updateIndicator('syncing', '強制取得中...');
      Logger.sync('[FORCE_PULL] 手動強制取得を開始しました。');

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const resp = await fetch(CLOUD_SYNC_ENDPOINT, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const cloudData = await resp.json();
        if (cloudData && (cloudData.studio === 'KUWAGATA_PREMIUM_STUDIO' || Array.isArray(cloudData.cardArchive))) {
          await this.applyCloudData(cloudData);

          state.localLastModifiedAt = cloudData.updatedAt || Date.now();
          await StorageVault.set('kuwagata_local_last_modified_v4', state.localLastModifiedAt);

          await saveState(false);
          renderDynamicChipGroups();
          updateCombinedPrompt();
          renderArchiveGrid();
          await reloadAllLayerImages();
          renderCard();

          this.updateIndicator('online', `同期完了 (${this.formatTime(new Date())})`);
          Logger.success(`[FORCE_PULL_SUCCESS] 強制同期完了 (Cards: ${state.cardArchive.length}件, Chips: ${state.chips.length}件)`);
          alert(`🎉 クラウドから最新データを強制取得しました！\n\n・単語辞書: ${state.chips.length} 件\n・非破壊カード履歴: ${state.cardArchive.length} 件\n\n画面を最新状態に更新しました。`);
        } else {
          alert('クラウド上に有効なスタジオデータが見つかりませんでした。');
        }
      } catch (err) {
        this.updateIndicator('error', '取得失敗');
        Logger.error('[FORCE_PULL_ERROR] 強制取得失敗', err.message);
        alert('クラウド取得エラー: ' + err.message);
      } finally {
        this.isSyncing = false;
        this.hasCompletedInitialPull = true;
      }
    },

    async applyCloudData(cloudData) {
      if (Array.isArray(cloudData.deletedCardIds)) {
        cloudData.deletedCardIds.forEach(id => state.deletedCardIds.add(id));
        await StorageVault.set('kuwagata_deleted_card_ids_v4', Array.from(state.deletedCardIds));
      }
      if (Array.isArray(cloudData.deletedChipIds)) {
        cloudData.deletedChipIds.forEach(id => state.deletedChipIds.add(id));
        await StorageVault.set('kuwagata_deleted_chip_ids_v4', Array.from(state.deletedChipIds));
      }

      if (Array.isArray(cloudData.cardArchive)) {
        const mergedMap = new Map();
        state.cardArchive.forEach(c => {
          if (!state.deletedCardIds.has(c.id)) mergedMap.set(c.id, c);
        });
        cloudData.cardArchive.forEach(c => {
          if (!state.deletedCardIds.has(c.id)) mergedMap.set(c.id, c);
        });
        state.cardArchive = Array.from(mergedMap.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      }

      if (cloudData.categories && Object.keys(cloudData.categories).length > 0) {
        state.categories = { ...state.categories, ...cloudData.categories };
      }
      if (Array.isArray(cloudData.chips)) {
        const chipMap = new Map();
        state.chips.forEach(c => { if (!state.deletedChipIds.has(c.id)) chipMap.set(c.id, c); });
        cloudData.chips.forEach(c => { if (!state.deletedChipIds.has(c.id)) chipMap.set(c.id, c); });
        state.chips = Array.from(chipMap.values());
      }
    },

    updateIndicator(status, text) {
      const dot = document.getElementById('headerSyncDot');
      const badge = document.getElementById('modalSyncBadge');
      const statusText = document.getElementById('cloudSyncStatusText');

      if (dot) dot.className = `sync-status-dot ${status}`;
      if (badge) {
        if (status === 'online') badge.textContent = '🟢 同期完了・安全';
        else if (status === 'syncing') badge.textContent = '🔵 通信中...';
        else if (status === 'pending') badge.textContent = '🟡 未送信あり';
        else if (status === 'error') badge.textContent = '🔴 通信待機中';
      }
      if (statusText) statusText.textContent = `最終同期: ${text}`;
    },

    formatTime(d) {
      return d.toTimeString().split(' ')[0];
    }
  };

  async function init() {
    setupAuthGate();
    loadApiKeyVault();
    Logger.info(`Kuwagata Card Studio ${APP_VERSION} (Direct Cloud Connect) を起動しました。`);
    
    // 🌟 IndexedDBからローカルデータを読み込み
    await loadSavedState();
    
    setupEventListeners();
    setupFloatingPreviewSystem();
    setupLocalhostFloatingSuite();
    setupDictManager();
    setupBackupManager();
    setupImageSaveModal();
    setupLetterPromptChips();
    setupSteppers();
    ['brandAiPromptInput', 'kanjiAiPromptInput', 'romajiAiPromptInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) autoResizePromptTextarea(el);
    });
    renderDynamicChipGroups();
    updateCombinedPrompt();
    updateKeyToggleUI();
    setupDropZone();
    setupVisionDropZone();
    renderArchiveGrid();
    
    // 🌟 クラウド初期確認（空データ誤送信ブロック付き・バックグラウンド非同期）
    CloudSyncManager.init();
    
    if (document.fonts) {
      await document.fonts.ready;
    }
    
    await reloadAllLayerImages();
    renderCard();
    HistoryManager.commit();
  }

  // --- 🧪 Localhost Floating Suite & 👑 神モード10回タップ専用PIN認証 ---
  function setupLocalhostFloatingSuite() {
    const floatingContainer = document.getElementById('localhostFloatingContainer');
    if (!floatingContainer) return;

    const isUnlocked = localStorage.getItem('kuwagata_localhost_unlocked') === 'true';
    if (IS_LOCAL_DEV || isUnlocked) {
      floatingContainer.classList.remove('hidden');
    } else {
      floatingContainer.classList.add('hidden');
    }

    const titleArea = document.getElementById('mainBrandTitleArea');
    const tapBadge = document.getElementById('tapCounterBadge');
    const godModeModal = document.getElementById('godModePinModal');
    const godModeForm = document.getElementById('godModePinForm');
    const pinInput = document.getElementById('godModePinInput');
    const errorMsg = document.getElementById('godModeErrorMsg');
    const btnCancel = document.getElementById('btnCancelGodModePin');
    const btnSubmit = document.getElementById('btnSubmitGodModePin');

    let tapCount = 0;
    let tapTimer = null;

    if (titleArea) {
      titleArea.addEventListener('click', (e) => {
        // 子要素のクリックも確実にカウント
        tapCount++;
        if (tapTimer) clearTimeout(tapTimer);

        if (tapBadge) {
          tapBadge.textContent = `${tapCount}/10`;
          tapBadge.classList.remove('hidden');
        }

        Logger.info(`👑 管理者アンロック・タップ検知: (${tapCount}/10)`);

        // 3.5秒間タップがなければリセット
        tapTimer = setTimeout(() => {
          if (tapCount > 0 && tapCount < 10) {
            Logger.info('タップ猶予時間タイムアウト: カウントをリセットしました');
          }
          tapCount = 0;
          if (tapBadge) tapBadge.classList.add('hidden');
        }, 3500);

        // 10回到達時: 専用の神モードPIN認証モーダルを開く
        if (tapCount >= 10) {
          tapCount = 0;
          if (tapTimer) clearTimeout(tapTimer);
          if (tapBadge) tapBadge.classList.add('hidden');

          if (godModeModal) {
            godModeModal.classList.remove('hidden');
            if (pinInput) {
              pinInput.value = '';
              setTimeout(() => pinInput.focus(), 150);
            }
            if (errorMsg) errorMsg.classList.add('hidden');
            Logger.info('👑 神モードPINログイン画面を開きました。4桁PINコードの入力を待機中...');
          }
        }
      });
    }

    // 🔒 神モードPIN認証処理
    function verifyGodModePin() {
      if (!pinInput) return;
      const val = (pinInput.value || '').trim();

      if (val === '1234') {
        if (godModeModal) godModeModal.classList.add('hidden');
        localStorage.setItem('kuwagata_localhost_unlocked', 'true');
        floatingContainer.classList.remove('hidden');
        Logger.success('👑 神モード（管理者Localhost Suite）をアンロックしました！', {
          authMethod: 'God Mode PIN Modal (1234)',
          unlockedTime: new Date().toISOString()
        });
        alert('👑 神モード（管理者Localhost Suite）をアンロックしました！');
      } else {
        if (errorMsg) {
          errorMsg.classList.remove('hidden');
          errorMsg.textContent = '❌ PINコードが正しくありません (初期PIN: 1234)';
        }
        pinInput.value = '';
        pinInput.focus();
        Logger.warn('神モードPIN認証に失敗しました。');
      }
    }

    if (godModeForm) {
      godModeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        verifyGodModePin();
      });
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        verifyGodModePin();
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        if (godModeModal) godModeModal.classList.add('hidden');
        Logger.info('神モードPIN認証をキャンセルしました。');
      });
    }

    if (pinInput) {
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          verifyGodModePin();
        }
      });
    }
  }

  // --- 🔒 パスワード認証ゲート ---
  function setupAuthGate() {
    const overlay = document.getElementById('authGateOverlay');
    const form = document.getElementById('authGateForm');
    const input = document.getElementById('authPassInput');
    const errorMsg = document.getElementById('authErrorMsg');

    const isAuth = localStorage.getItem(VAULT_KEYS.AUTH_PASSED) === 'true' ||
                   sessionStorage.getItem('kuwagata_auth_passed') === 'true';

    if (isAuth) {
      localStorage.setItem(VAULT_KEYS.AUTH_PASSED, 'true');
      if (overlay) overlay.classList.add('authenticated');
      return;
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = (input.value || '').trim();
        if (VALID_PASSCODES.includes(pass.toLowerCase())) {
          localStorage.setItem(VAULT_KEYS.AUTH_PASSED, 'true');
          sessionStorage.setItem('kuwagata_auth_passed', 'true');
          overlay.classList.add('authenticated');
          Logger.success('合言葉認証に成功しました。スタジオを開放します。');
        } else {
          if (errorMsg) errorMsg.classList.remove('hidden');
          input.value = '';
          input.focus();
        }
      });
    }
  }

  // --- ↩️ 履歴管理・アンドゥマネージャー (HistoryManager - v4.34.0) ---
  const HistoryManager = {
    history: [],
    currentIndex: -1,
    maxDepth: 30,
    isUndoing: false,
    timer: null,

    captureSnapshot() {
      return {
        aspectRatio: state.aspectRatio,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        layers: JSON.parse(JSON.stringify(state.layers))
      };
    },

    commit(snapshot) {
      if (this.isUndoing) return;
      const snap = snapshot || this.captureSnapshot();
      if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
        if (JSON.stringify(this.history[this.currentIndex]) === JSON.stringify(snap)) {
          return;
        }
      }
      // 不要になった未来履歴を切り捨て
      this.history = this.history.slice(0, this.currentIndex + 1);
      this.history.push(snap);
      if (this.history.length > this.maxDepth) {
        this.history.shift();
      } else {
        this.currentIndex++;
      }
      this.updateButtons();
    },

    pushDebounced(ms = 350) {
      if (this.isUndoing) return;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.timer = null;
        this.commit();
      }, ms);
    },

    flushDebounce() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
        this.commit();
      }
    },

    async undo() {
      // 保留中のデバウンス変更があれば確定させる
      this.flushDebounce();

      if (this.currentIndex <= 0) {
        Logger.info('↩️ [UNDO] これ以上戻る操作履歴がありません');
        this.updateButtons();
        return;
      }

      this.isUndoing = true;
      try {
        this.currentIndex--;
        const targetState = this.history[this.currentIndex];
        if (targetState) {
          state.aspectRatio = targetState.aspectRatio;
          state.canvasWidth = targetState.canvasWidth;
          state.canvasHeight = targetState.canvasHeight;
          state.layers = JSON.parse(JSON.stringify(targetState.layers));

          await reloadAllLayerImages();
          syncInputsFromState();
          renderCard();
          await saveState(false);
          Logger.info(`↩️ [UNDO] 直前の操作状態に戻しました (履歴位置: ${this.currentIndex + 1}/${this.history.length})`);
        }
      } catch (err) {
        Logger.error('↩️ [UNDO] 復元エラー', err.message);
      } finally {
        this.isUndoing = false;
        this.updateButtons();
      }
    },

    updateButtons() {
      const canUndo = this.currentIndex > 0;
      ['btnUndo', 'railBtnUndo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.disabled = !canUndo;
          el.classList.toggle('disabled', !canUndo);
        }
      });
    }
  };

  // 🌟 StorageVault (IndexedDB) への完全保存
  async function saveState(triggerCloud = true) {
    try {
      const stateObj = {
        aspectRatio: state.aspectRatio,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        showCalibrationOverlay: state.showCalibrationOverlay,
        showSafetyGuide: state.showSafetyGuide,
        safetyMargin: state.safetyMargin,
        layers: state.layers,
        selectedChipIds: Array.from(state.selectedChipIds),
        aiPrompt: aiPromptInput ? aiPromptInput.value : state.aiPrompt,
        letterPrompts: {
          brand: document.getElementById('brandAiPromptInput')?.value || '',
          kanji: document.getElementById('kanjiAiPromptInput')?.value || '',
          romaji: document.getElementById('romajiAiPromptInput')?.value || ''
        }
      };

      await StorageVault.set('kuwagata_card_studio_state_v4', stateObj);
      await StorageVault.set('kuwagata_categories_v4', state.categories);
      await StorageVault.set('kuwagata_chips_v4', state.chips);
      await StorageVault.set('kuwagata_card_archive_v4', state.cardArchive);
      await StorageVault.set('kuwagata_deleted_card_ids_v4', Array.from(state.deletedCardIds));
      await StorageVault.set('kuwagata_deleted_chip_ids_v4', Array.from(state.deletedChipIds));

      saveApiKeyVault();

      if (!HistoryManager.isUndoing) {
        HistoryManager.pushDebounced(350);
      }

      Logger.storage(`[INDEXED_DB_SAVE] 大容量データベース保存成功 (Cards: ${state.cardArchive.length}件, Chips: ${state.chips.length}件)`);

      if (triggerCloud) {
        CloudSyncManager.pushToCloud(true);
      }
    } catch (e) {
      Logger.error('[STORAGE_ERROR] IndexedDB 保存例外', e.message);
    }
  }

  // 🌟 StorageVault (IndexedDB) からの完全読み込み
  async function loadSavedState() {
    try {
      const savedTime = await StorageVault.get('kuwagata_local_last_modified_v4');
      if (savedTime) state.localLastModifiedAt = parseInt(savedTime, 10);

      const savedDelCards = await StorageVault.get('kuwagata_deleted_card_ids_v4');
      if (savedDelCards) state.deletedCardIds = new Set(savedDelCards);

      const savedDelChips = await StorageVault.get('kuwagata_deleted_chip_ids_v4');
      if (savedDelChips) state.deletedChipIds = new Set(savedDelChips);

      const savedCategories = await StorageVault.get('kuwagata_categories_v4');
      if (savedCategories) state.categories = savedCategories;

      const savedChips = await StorageVault.get('kuwagata_chips_v4');
      if (savedChips && Array.isArray(savedChips)) {
        state.chips = savedChips.filter(c => !state.deletedChipIds.has(c.id));
      }

      const savedArchive = await StorageVault.get('kuwagata_card_archive_v4');
      if (savedArchive && Array.isArray(savedArchive)) {
        state.cardArchive = savedArchive.filter(c => !state.deletedCardIds.has(c.id));
      }

      const saved = await StorageVault.get('kuwagata_card_studio_state_v4');
      if (saved) {
        if (saved.layers) {
          state.layers = saved.layers;
          if (state.layers.specs) {
            const specs = state.layers.specs;
            if (specs.ownerLabel && !specs.ownerLabel.color) specs.ownerLabel.color = '#222222';
            if (specs.owner && !specs.owner.color) specs.owner.color = '#111111';
            if (specs.serial && !specs.serial.color) specs.serial.color = '#2a2a2a';
            if (specs.size && !specs.size.color) specs.size.color = '#111111';
            if (specs.extra && !specs.extra.color) specs.extra.color = '#444444';
            ['ownerLabel', 'owner', 'serial', 'size', 'extra'].forEach(k => {
              if (specs[k]) {
                if (specs[k].shadow === undefined) specs[k].shadow = false;
                if (specs[k].glow === undefined) specs[k].glow = false;
                if (specs[k].glowBlur === undefined) specs[k].glowBlur = 14;
              }
            });
          }
          if (state.layers.brand) {
            if (!state.layers.brand.color) state.layers.brand.color = 'gold';
            if (state.layers.brand.shadow === undefined) state.layers.brand.shadow = false;
            if (state.layers.brand.glow === undefined) state.layers.brand.glow = false;
            if (state.layers.brand.glowBlur === undefined) state.layers.brand.glowBlur = 14;
          }
          if (state.layers.kanji) {
            if (!state.layers.kanji.color) state.layers.kanji.color = '#111111';
            if (state.layers.kanji.shadow === undefined) state.layers.kanji.shadow = false;
            if (state.layers.kanji.glow === undefined) state.layers.kanji.glow = false;
            if (state.layers.kanji.glowBlur === undefined) state.layers.kanji.glowBlur = 14;
          }
          if (state.layers.romaji) {
            if (!state.layers.romaji.color) state.layers.romaji.color = 'gold';
            if (state.layers.romaji.shadow === undefined) state.layers.romaji.shadow = false;
            if (state.layers.romaji.glow === undefined) state.layers.romaji.glow = false;
            if (state.layers.romaji.glowBlur === undefined) state.layers.romaji.glowBlur = 14;
          }
        }
        if (saved.aspectRatio) state.aspectRatio = saved.aspectRatio;
        if (saved.canvasWidth) state.canvasWidth = saved.canvasWidth;
        if (saved.canvasHeight) state.canvasHeight = saved.canvasHeight;
        if (saved.showCalibrationOverlay !== undefined) state.showCalibrationOverlay = !!saved.showCalibrationOverlay;
        if (saved.showSafetyGuide !== undefined) state.showSafetyGuide = !!saved.showSafetyGuide;
        if (saved.safetyMargin !== undefined) state.safetyMargin = Number(saved.safetyMargin);
        if (saved.selectedChipIds) state.selectedChipIds = new Set(saved.selectedChipIds);
        if (saved.aiPrompt) {
          state.aiPrompt = saved.aiPrompt;
          if (aiPromptInput) aiPromptInput.value = saved.aiPrompt;
        }
        if (saved.letterPrompts) {
          ['brand', 'kanji', 'romaji'].forEach(k => {
            const el = document.getElementById(`${k}AiPromptInput`);
            if (el && saved.letterPrompts[k]) el.value = saved.letterPrompts[k];
          });
        }
      }
      syncInputsFromState();
      Logger.storage(`[INDEXED_DB_LOAD] 端末内大容量データ復元完了 (Cards: ${state.cardArchive.length}件, Chips: ${state.chips.length}件)`);
    } catch (e) {
      Logger.error('[INDEXED_DB_LOAD_ERROR] 読み込み例外', e.message);
    }
  }

  function syncInputsFromState() {
    setVal('brandText', state.layers.brand.text);
    setCheck('brandRedInitial', state.layers.brand.redInitial);
    setVal('brandYOffset', state.layers.brand.y);
    setVal('brandYVal', state.layers.brand.y + '%');
    setVal('brandXOffset', state.layers.brand.x);
    setVal('brandXVal', state.layers.brand.x + 'px');
    setVal('brandScale', state.layers.brand.scale);
    setVal('brandScaleVal', state.layers.brand.scale + '%');
    const updateResetButton = (btnId, hasAi) => {
      const btn = document.getElementById(btnId);
      if (btn) btn.classList.toggle('hidden', !hasAi);
    };

    updateLayerBadge('brandLayerBadge', !!state.layers.brand.aiGraphicDataUrl, 'AI文字生成済', '標準フォント描画中');
    updateResetButton('btnResetToFontBrand', !!state.layers.brand.aiGraphicDataUrl);

    setVal('kanjiText', state.layers.kanji.text);
    setVal('kanjiFont', state.layers.kanji.font);
    setVal('kanjiYOffset', state.layers.kanji.y);
    setVal('kanjiYVal', state.layers.kanji.y + '%');
    setVal('kanjiXOffset', state.layers.kanji.x);
    setVal('kanjiXVal', state.layers.kanji.x + 'px');
    setVal('kanjiScale', state.layers.kanji.scale);
    setVal('kanjiScaleVal', state.layers.kanji.scale + '%');
    setVal('kanjiOpacity', state.layers.kanji.opacity);
    setVal('kanjiOpacityVal', state.layers.kanji.opacity + '%');
    updateLayerBadge('kanjiLayerBadge', !!state.layers.kanji.aiGraphicDataUrl, 'AI毛筆生成済', '標準筆文字描画中');
    updateResetButton('btnResetToFontKanji', !!state.layers.kanji.aiGraphicDataUrl);

    setVal('romajiText', state.layers.romaji.text);
    setVal('romajiFont', state.layers.romaji.font);
    setVal('romajiYOffset', state.layers.romaji.y);
    setVal('romajiYVal', state.layers.romaji.y + '%');
    setVal('romajiXOffset', state.layers.romaji.x);
    setVal('romajiXVal', state.layers.romaji.x + 'px');
    setVal('romajiScale', state.layers.romaji.scale);
    setVal('romajiScaleVal', state.layers.romaji.scale + '%');
    setVal('romajiOpacity', state.layers.romaji.opacity);
    setVal('romajiOpacityVal', state.layers.romaji.opacity + '%');
    updateLayerBadge('romajiLayerBadge', !!state.layers.romaji.aiGraphicDataUrl, 'AI欧文生成済', '標準欧文描画中');
    updateResetButton('btnResetToFontRomaji', !!state.layers.romaji.aiGraphicDataUrl);

    if (!state.layers.specs.ownerLabel) {
      state.layers.specs.ownerLabel = {
        text: state.layers.specs.owner.label || 'Owner',
        font: "'Cinzel', serif",
        size: 36,
        y: (state.layers.specs.owner.y ? state.layers.specs.owner.y - 4 : 74),
        x: 0,
        color: '#222222',
        shadow: false,
        glow: false,
        glowBlur: 14
      };
    }
    setVal('ownerLabelText', state.layers.specs.ownerLabel.text);
    setVal('ownerLabelFontSelect', state.layers.specs.ownerLabel.font);
    setVal('ownerLabelSize', state.layers.specs.ownerLabel.size);
    setVal('ownerLabelSizeVal', state.layers.specs.ownerLabel.size + 'px');
    setVal('ownerLabelYOffset', state.layers.specs.ownerLabel.y);
    setVal('ownerLabelYVal', state.layers.specs.ownerLabel.y + '%');

    setVal('ownerName', state.layers.specs.owner.text);
    setVal('ownerFontSelect', state.layers.specs.owner.font);
    setVal('ownerSize', state.layers.specs.owner.size);
    setVal('ownerSizeVal', state.layers.specs.owner.size + 'px');
    setVal('ownerYOffset', state.layers.specs.owner.y);
    setVal('ownerYVal', state.layers.specs.owner.y + '%');

    setVal('serialText', state.layers.specs.serial.text);
    setVal('serialFontSelect', state.layers.specs.serial.font);
    setVal('serialSize', state.layers.specs.serial.size);
    setVal('serialSizeVal', state.layers.specs.serial.size + 'px');
    setVal('serialYOffset', state.layers.specs.serial.y);
    setVal('serialYVal', state.layers.specs.serial.y + '%');

    setVal('sizeText', state.layers.specs.size.text);
    setVal('sizeFontSelect', state.layers.specs.size.font);
    setVal('sizeSize', state.layers.specs.size.size);
    setVal('sizeSizeVal', state.layers.specs.size.size + 'px');
    setVal('sizeYOffset', state.layers.specs.size.y);
    setVal('sizeYVal', state.layers.specs.size.y + '%');

    setVal('extraInfoText', state.layers.specs.extra.text);
    setVal('extraFontSelect', state.layers.specs.extra.font);
    setVal('extraSize', state.layers.specs.extra.size);
    setVal('extraSizeVal', state.layers.specs.extra.size + 'px');
    setVal('extraYOffset', state.layers.specs.extra.y);
    setVal('extraYVal', state.layers.specs.extra.y + '%');

    // 🎨 スペック文字カラー同期
    const syncSpecColor = (id, color, defColor) => {
      const activeColor = color || defColor;
      const colorInput = document.getElementById(id);
      if (colorInput) {
        if (activeColor === 'gold') {
          colorInput.value = '#d4af37';
        } else if (/^#[0-9a-fA-F]{6}$/.test(activeColor)) {
          colorInput.value = activeColor;
        } else {
          colorInput.value = defColor;
        }
      }
      const chipGroup = document.querySelector(`.color-preset-chips[data-target="${id}"]`);
      if (chipGroup) {
        chipGroup.querySelectorAll('.btn-color-chip').forEach(c => {
          if (activeColor === 'gold') {
            c.classList.toggle('active', c.dataset.color === 'gold');
          } else {
            c.classList.toggle('active', c.dataset.color.toLowerCase() === activeColor.toLowerCase());
          }
        });
      }
    };

    syncSpecColor('brandColor', state.layers.brand?.color, 'gold');
    syncSpecColor('kanjiColor', state.layers.kanji?.color, '#111111');
    syncSpecColor('romajiColor', state.layers.romaji?.color, 'gold');
    syncSpecColor('ownerLabelColor', state.layers.specs.ownerLabel?.color, '#222222');
    syncSpecColor('ownerColor', state.layers.specs.owner?.color, '#111111');
    syncSpecColor('serialColor', state.layers.specs.serial?.color, '#2a2a2a');
    syncSpecColor('sizeColor', state.layers.specs.size?.color, '#111111');
    syncSpecColor('extraColor', state.layers.specs.extra?.color, '#444444');

    // 🌫️ スペック文字エフェクト同期（白い霧 ＆ 影 ＆ ぼかし強度）
    const syncSpecFx = (targetKey, spec) => {
      if (!spec) return;
      const isGlow = !!spec.glow;
      const isShadow = !!spec.shadow;
      const blur = spec.glowBlur !== undefined ? spec.glowBlur : 14;

      const glowBtn = document.getElementById(`${targetKey}GlowBtn`);
      if (glowBtn) {
        glowBtn.classList.toggle('active', isGlow);
        const tag = glowBtn.querySelector('.fx-state-tag');
        if (tag) tag.textContent = isGlow ? 'ON' : 'OFF';
      }

      const shadowBtn = document.getElementById(`${targetKey}ShadowBtn`);
      if (shadowBtn) {
        shadowBtn.classList.toggle('active', isShadow);
        const tag = shadowBtn.querySelector('.fx-state-tag');
        if (tag) tag.textContent = isShadow ? 'ON' : 'OFF';
      }

      const glowRow = document.getElementById(`${targetKey}GlowRow`);
      if (glowRow) {
        glowRow.classList.toggle('hidden', !isGlow);
      }

      setVal(`${targetKey}GlowBlur`, blur);
      setVal(`${targetKey}GlowBlurVal`, blur + 'px');
    };

    syncSpecFx('brand', state.layers.brand);
    syncSpecFx('kanji', state.layers.kanji);
    syncSpecFx('romaji', state.layers.romaji);
    syncSpecFx('ownerLabel', state.layers.specs.ownerLabel);
    syncSpecFx('owner', state.layers.specs.owner);
    syncSpecFx('serial', state.layers.specs.serial);
    syncSpecFx('size', state.layers.specs.size);
    syncSpecFx('extra', state.layers.specs.extra);

    // 📐 印刷安全枠ガイド入力の同期
    setCheck('toggleSafetyGuide', !!state.showSafetyGuide);
    setVal('safetyMarginInput', state.safetyMargin !== undefined ? state.safetyMargin : 3);
    updateSafetyStateBadge(!!state.showSafetyGuide);
    const btnCalib = document.getElementById('btnToggleCalibration') || document.getElementById('btnSetCalibrationBg');
    if (btnCalib) {
      btnCalib.classList.toggle('active', !!state.showCalibrationOverlay);
      btnCalib.textContent = state.showCalibrationOverlay ? '📐 スケール表示中' : '📐 測定スケール';
      btnCalib.title = state.showCalibrationOverlay ? 'クリックで測定スケールを非表示にします' : '目盛り・ルーラー測定スケールを画面に重ねて表示（クリックでON/OFF切替）';
    }

    document.querySelectorAll('.ratio-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ratio === state.aspectRatio);
    });
    const pw = document.getElementById('previewWrapper');
    if (pw && state.aspectRatio) {
      pw.style.aspectRatio = state.aspectRatio.replace(':', ' / ');
    }
  }

  function updateLayerBadge(badgeId, isAi, aiText, normalText) {
    const badge = document.getElementById(badgeId);
    if (!badge) return;
    if (isAi) {
      badge.className = 'layer-badge active-ai';
      badge.textContent = `✨ ${aiText}`;
    } else {
      badge.className = 'layer-badge';
      badge.textContent = normalText;
    }
  }

  function updateSafetyStateBadge(isOn) {
    const badge = document.getElementById('safetyStateBadge');
    if (badge) {
      badge.textContent = isOn ? 'ON' : 'OFF';
      badge.classList.toggle('active', !!isOn);
    }
  }

  // 🎴 独立フローティング・プレビュー確認シート制御 (上部ドロップダウン方式 v4.20.0)
  function syncFloatingCanvas() {
    const fCanvas = document.getElementById('floatingCanvas');
    const fpdRatioTag = document.getElementById('fpdRatioTag');
    const fpdMeta = document.getElementById('fpdMeta');
    if (!fCanvas || !canvas) return;
    fCanvas.width = canvas.width;
    fCanvas.height = canvas.height;
    const fCtx = fCanvas.getContext('2d');
    fCtx.clearRect(0, 0, fCanvas.width, fCanvas.height);
    fCtx.drawImage(canvas, 0, 0);
    if (fpdRatioTag) fpdRatioTag.textContent = `比率: ${state.aspectRatio || '5:7'}`;
    if (fpdMeta) fpdMeta.textContent = `${state.canvasWidth || 1500} × ${state.canvasHeight || 2100} px`;
  }

  function openFloatingPreviewDrawer() {
    syncFloatingCanvas();
    const drawer = document.getElementById('floatingPreviewDrawer');
    const chevron = document.getElementById('fpbChevron');
    const badge = document.getElementById('fpbBadge');
    if (drawer) {
      drawer.classList.remove('hidden');
      if (chevron) chevron.textContent = '▲';
      if (badge) badge.textContent = '閉じる';
      Logger.info('[FLOATING_PREVIEW] 上部ドロップダウン確認シートを展開');
    }
  }

  function closeFloatingPreviewDrawer() {
    const drawer = document.getElementById('floatingPreviewDrawer');
    const chevron = document.getElementById('fpbChevron');
    const badge = document.getElementById('fpbBadge');
    if (drawer) {
      drawer.classList.add('hidden');
      if (chevron) chevron.textContent = '▼';
      if (badge) badge.textContent = '確認する';
    }
  }

  function toggleFloatingPreviewDrawer() {
    const drawer = document.getElementById('floatingPreviewDrawer');
    if (drawer && !drawer.classList.contains('hidden')) {
      closeFloatingPreviewDrawer();
    } else {
      openFloatingPreviewDrawer();
    }
  }

  function setupFloatingPreviewSystem() {
    const previewSec = document.getElementById('previewSection') || document.getElementById('stickyPreviewSection');
    const floatingBar = document.getElementById('floatingPreviewBar');
    const fpdBackdrop = document.getElementById('fpdBackdrop');
    const btnFpdClose = document.getElementById('btnFpdClose');
    const btnFpdCloseAction = document.getElementById('btnFpdCloseAction');

    if (floatingBar) {
      floatingBar.addEventListener('click', toggleFloatingPreviewDrawer);
    }
    if (fpdBackdrop) {
      fpdBackdrop.addEventListener('click', closeFloatingPreviewDrawer);
    }
    if (btnFpdClose) {
      btnFpdClose.addEventListener('click', closeFloatingPreviewDrawer);
    }
    if (btnFpdCloseAction) {
      btnFpdCloseAction.addEventListener('click', closeFloatingPreviewDrawer);
    }

    if (previewSec && floatingBar && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // プレビューが画面上部にスクロールアウトした時のみミニバーを表示
          const isScrolledPast = entry.boundingClientRect.bottom < 60;
          if (!entry.isIntersecting && isScrolledPast) {
            floatingBar.classList.remove('hidden');
          } else {
            floatingBar.classList.add('hidden');
            closeFloatingPreviewDrawer();
          }
        });
      }, {
        root: null,
        threshold: [0, 0.1, 0.5]
      });

      observer.observe(previewSec);
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'SPAN') {
        el.textContent = val;
      } else if (el.type === 'number') {
        const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
        el.value = isNaN(num) ? '' : num;
      } else {
        el.value = val;
      }
    }
  }

  function setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  }

  // --- 📝 AI文字スタイルチップのスマートトグル (ON/OFF) ＆ 自動全行展開 ---
  function toggleLetterChip(btn) {
    const target = btn.dataset.target;
    const text = btn.dataset.text;
    const textareaId = `${target}AiPromptInput`;
    const textarea = document.getElementById(textareaId);
    if (!textarea || !text) return;

    const currentVal = textarea.value;
    const isPresent = currentVal.includes(text);
    const isCurrentlyActive = btn.classList.contains('active') || isPresent;

    if (isCurrentlyActive) {
      // 🗑️ 解除（OFF）: 該当のスタイル文言のみを抜き取ってピンポイント削除
      let val = currentVal.split(text).join('');
      val = val.replace(/、+/g, '、').replace(/^[、\s]+|[、\s]+$/g, '');
      textarea.value = val;
      btn.classList.remove('active');
      Logger.info(`AI文字プロンプトチップ解除 [${target}]: ${text}`);
    } else {
      // ➕ 追加（ON）: ピンポイント追記
      let val = currentVal.trim();
      if (!val) {
        textarea.value = text;
      } else {
        textarea.value = val + '、' + text;
      }
      btn.classList.add('active');
      Logger.info(`AI文字プロンプトチップ追加 [${target}]: ${text}`);
    }
    autoResizePromptTextarea(textarea);
    saveState();
  }

  function syncLetterChipsForTarget(target) {
    const textarea = document.getElementById(`${target}AiPromptInput`);
    if (!textarea) return;
    const val = textarea.value;
    document.querySelectorAll(`.letter-chip[data-target="${target}"]`).forEach(btn => {
      const text = btn.dataset.text;
      if (text && val.includes(text)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function setupLetterPromptChips() {
    document.querySelectorAll('.letter-chip').forEach(btn => {
      btn.addEventListener('click', () => toggleLetterChip(btn));
    });

    ['brand', 'kanji', 'romaji'].forEach(target => {
      const el = document.getElementById(`${target}AiPromptInput`);
      if (el) {
        el.addEventListener('input', () => {
          autoResizePromptTextarea(el);
          syncLetterChipsForTarget(target);
          saveState();
        });
      }
      syncLetterChipsForTarget(target);
    });
  }

  // --- 🎛️ スライダーステッパー（±1微調整 ＆ 直接数値入力） ---
  function setupSteppers() {
    document.querySelectorAll('.stepper-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.dataset.target;
        const slider = document.getElementById(targetId);
        if (!slider) return;

        const isInc = btn.classList.contains('stepper-inc');
        const min = parseInt(slider.min, 10);
        const max = parseInt(slider.max, 10);
        const step = parseInt(slider.step, 10) || 1;
        const current = parseInt(slider.value, 10);

        const next = isInc
          ? Math.min(isNaN(max) ? Infinity : max, current + step)
          : Math.max(isNaN(min) ? -Infinity : min, current - step);

        if (next !== current) {
          slider.value = next;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });

    document.querySelectorAll('.stepper-input').forEach(input => {
      const applyInput = () => {
        const targetId = input.dataset.target;
        const slider = document.getElementById(targetId);
        if (!slider) return;

        let num = parseInt(input.value, 10);
        if (isNaN(num)) return;

        const min = parseInt(slider.min, 10);
        const max = parseInt(slider.max, 10);
        if (!isNaN(min)) num = Math.max(min, num);
        if (!isNaN(max)) num = Math.min(max, num);

        if (parseInt(slider.value, 10) !== num) {
          slider.value = num;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      input.addEventListener('input', applyInput);
      input.addEventListener('change', applyInput);
    });
  }

  function isIOSDevice() {
    const ua = navigator.userAgent || '';
    const isIPhone = /iPhone|iPad|iPod/.test(ua);
    const isIPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return isIPhone || isIPadOS;
  }

  let currentExportFile = null;

  // --- 🖼️ 万能画像保存 ＆ 写真（カメラロール）ダイレクト保存モーダル (v4.9.0) ---
  function setupImageSaveModal() {
    const btnClose = document.getElementById('btnCloseImageSaveModal');
    const btnCloseBottom = document.getElementById('btnCloseImageSaveModalBottom');
    const btnShareToPhotos = document.getElementById('btnShareToPhotos');

    [btnClose, btnCloseBottom].forEach(btn => {
      if (btn) btn.addEventListener('click', () => imageSaveModal.classList.add('hidden'));
    });

    if (btnShareToPhotos) {
      btnShareToPhotos.addEventListener('click', async () => {
        if (!currentExportFile) {
          alert('保存対象の画像ファイルが準備されていません。再度出力ボタンを押してください。');
          return;
        }

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [currentExportFile] })) {
          try {
            Logger.info('📱 Web Share API (共有シート) 呼び出し開始', {
              filename: currentExportFile.name,
              sizeKB: Math.round(currentExportFile.size / 1024),
              isIOS: isIOSDevice()
            });

            // ⚠️ iOSで「画像を保存」を確実に出現させるため、files のみを含める
            await navigator.share({
              files: [currentExportFile]
            });

            Logger.success('📱 Web Share API 完了（写真への保存メニュー表示）');
          } catch (err) {
            if (err.name === 'AbortError') {
              Logger.info('共有シートがユーザーによって閉じられました');
            } else {
              Logger.warn('Web Share API 実行例外', err.message);
              alert('写真保存メニューの起動に失敗しました。下のカード画像を「1秒長押し ➔ 写真に追加」してください。');
            }
          }
        } else {
          alert('お使いの端末またはブラウザは写真直接保存（Web Share）に対応していません。\n下のカード画像を1秒長押しして「”写真”に追加」を選択してください。');
        }
      });
    }
  }

  function openImageSaveModal(dataUrl, filename, exportFile = null) {
    const previewImg = document.getElementById('savedModalImagePreview');
    const directLink = document.getElementById('btnDirectDownloadLink');
    const shareArea = document.getElementById('shareToPhotosActionArea');

    currentExportFile = exportFile;

    if (previewImg) previewImg.src = dataUrl;
    if (directLink) {
      directLink.href = dataUrl;
      directLink.download = filename;
    }

    const canShare = !!(navigator.share && navigator.canShare && currentExportFile && navigator.canShare({ files: [currentExportFile] }));
    if (shareArea) {
      shareArea.style.display = canShare ? 'block' : 'none';
    }

    imageSaveModal.classList.remove('hidden');

    Logger.info('🖼️ 写真保存案内モーダル表示', {
      filename: filename,
      isIOS: isIOSDevice(),
      canShareFiles: canShare,
      fileSizeKB: exportFile ? Math.round(exportFile.size / 1024) : 0
    });
  }

  // --- ☁️ 同期＆バックアップUI設定 ---
  function setupBackupManager() {
    const btnHeaderSync = document.getElementById('btnHeaderCloudSync');
    const btnClose = document.getElementById('btnCloseBackupModal');
    const btnCloseBottom = document.getElementById('btnCloseBackupModalBottom');
    const btnExport = document.getElementById('btnExportBackup');
    const btnTriggerImport = document.getElementById('btnTriggerImport');
    const fileInput = document.getElementById('backupFileInput');

    const btnForceUpload = document.getElementById('btnForceUploadCloud');
    const btnForceDownload = document.getElementById('btnForceDownloadCloud');
    const btnQuickSyncNow = document.getElementById('btnQuickSyncNow');
    const btnSettingsOpenBackup = document.getElementById('btnSettingsOpenBackupModal');

    if (btnHeaderSync) btnHeaderSync.addEventListener('click', () => backupModal.classList.remove('hidden'));
    if (btnQuickSyncNow) {
      btnQuickSyncNow.addEventListener('click', () => {
        Logger.info('⚙️ 設定タブから即時クラウド同期を実行');
        CloudSyncManager.pushToCloud(false, true);
      });
    }
    if (btnSettingsOpenBackup) {
      btnSettingsOpenBackup.addEventListener('click', () => {
        if (backupModal) backupModal.classList.remove('hidden');
      });
    }
    [btnClose, btnCloseBottom].forEach(b => {
      if (b) b.addEventListener('click', () => backupModal.classList.add('hidden'));
    });

    if (btnForceUpload) btnForceUpload.addEventListener('click', () => CloudSyncManager.pushToCloud(false, true));
    if (btnForceDownload) btnForceDownload.addEventListener('click', () => CloudSyncManager.forcePullFromCloud());

    if (btnExport) btnExport.addEventListener('click', () => exportBackupData());
    if (btnTriggerImport && fileInput) {
      btnTriggerImport.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          importBackupData(e.target.files[0]);
          fileInput.value = '';
        }
      });
    }
  }

  function exportBackupData() {
    const payload = CloudSyncManager.getSanitizedPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const filename = `kuwagata_multilayer_backup_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    Logger.success(`非破壊バックアップを書き出しました (${filename})`);
    alert(`🎉 バックアップファイルをダウンロードしました！\n\nファイル名: ${filename}`);
  }

  function importBackupData(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || data.studio !== 'KUWAGATA_PREMIUM_STUDIO') {
          throw new Error('クワガタカードスタジオのバックアップファイルではありません。');
        }

        if (data.categories) state.categories = data.categories;
        if (data.chips && Array.isArray(data.chips)) state.chips = data.chips;
        if (data.selectedChipIds && Array.isArray(data.selectedChipIds)) state.selectedChipIds = new Set(data.selectedChipIds);
        if (data.cardArchive && Array.isArray(data.cardArchive)) state.cardArchive = data.cardArchive;

        await saveState(true);
        renderDynamicChipGroups();
        updateCombinedPrompt();
        renderArchiveGrid();
        await reloadAllLayerImages();
        renderCard();

        Logger.success('バックアップデータのインポート＆自動同期完了');
        alert(`🎉 データを正常に復元しました！\n\n・単語辞書: ${state.chips.length} 件\n・非破壊カード履歴: ${state.cardArchive.length} 件`);
        backupModal.classList.add('hidden');
      } catch (err) {
        Logger.error('インポート失敗', err.message);
        alert('バックアップ読み込みエラー: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // --- APIキー切り替えUI ---
  function updateKeyToggleUI() {
    if (!btnQuickToggleKey || !keyModeLabel) return;
    if (state.activeKeyMode === 'paid') {
      btnQuickToggleKey.className = 'btn-header-tag paid-tag full-width-tag';
      keyModeLabel.textContent = '有料キー';
    } else {
      btnQuickToggleKey.className = 'btn-header-tag free-tag full-width-tag';
      keyModeLabel.textContent = '無料キー';
    }
  }

  // --- タブ1: 動的カテゴリーチップグループ描画 ---
  function renderDynamicChipGroups() {
    if (!dynamicChipGroupsContainer) return;
    dynamicChipGroupsContainer.innerHTML = '';

    const catKeys = Object.keys(state.categories);

    catKeys.forEach(catKey => {
      const catName = state.categories[catKey] || catKey;
      const visibleChips = state.chips.filter(c => c.category === catKey && c.isVisible && !state.deletedChipIds.has(c.id));

      const groupEl = document.createElement('div');
      groupEl.className = 'chip-group';

      const labelEl = document.createElement('label');
      labelEl.className = 'chip-group-label';
      labelEl.textContent = `【${catName}】`;
      groupEl.appendChild(labelEl);

      const gridEl = document.createElement('div');
      gridEl.className = 'chip-grid';

      visibleChips.forEach(chip => {
        const isSelected = state.selectedChipIds.has(chip.id);
        const chipEl = document.createElement('button');
        chipEl.type = 'button';
        chipEl.className = `word-chip ${chip.isCustom ? 'custom' : ''} ${isSelected ? 'active' : ''}`;
        chipEl.dataset.chipId = chip.id;

        let displayText = chip.text;
        if (catKey === 'prefix') {
          displayText = chip.text.length > 20 ? chip.text.slice(0, 18) + '…' : chip.text;
        }

        chipEl.innerHTML = `
          <span>${Logger.escapeHtml(displayText)}</span>
          ${chip.isCustom ? `<span class="chip-del-btn" data-action="del-chip" data-id="${chip.id}" title="削除">✕</span>` : ''}
        `;

        chipEl.addEventListener('click', (e) => {
          if (e.target.classList.contains('chip-del-btn')) {
            e.stopPropagation();
            deleteChip(chip.id);
            return;
          }

          toggleBackgroundChip(chip, chipEl);
        });

        gridEl.appendChild(chipEl);
      });

      groupEl.appendChild(gridEl);
      dynamicChipGroupsContainer.appendChild(groupEl);
    });
  }

  // 🌟 プロンプトテキストエリアの自動全行展開（スクロールバー根絶・全可視化）
  function autoResizePromptTextarea(el = aiPromptInput) {
    if (!el) return;
    el.style.height = 'auto';
    const minH = (el.id === 'aiPromptInput') ? 100 : 54;
    const newH = Math.max(el.scrollHeight, minH);
    el.style.height = `${newH}px`;
  }

  // 🌟 背景プロンプトチップのスマートトグル (ON/OFF) ＆ 手動編集の完全保護
  function toggleBackgroundChip(chip, chipEl) {
    if (!aiPromptInput) return;
    const text = chip.text;
    let val = aiPromptInput.value;
    const bullet = `・${text}`;
    const isCurrentlyActive = state.selectedChipIds.has(chip.id) || val.includes(text);

    if (isCurrentlyActive) {
      // 🗑️ 解除 (OFF): 該当行・文言のみを抜き取って削除（手動入力行は100%保持）
      state.selectedChipIds.delete(chip.id);
      if (chipEl) chipEl.classList.remove('active');

      const lines = val.split('\n');
      const newLines = lines.filter(l => {
        const t = l.trim();
        return t !== bullet && t !== text && t !== `・${text}。` && t !== `${text}。`;
      });
      aiPromptInput.value = newLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      Logger.info(`背景プロンプトチップ解除 [${chip.category}]: ${text}`);
    } else {
      // ➕ 追加 (ON): アスペクト比指定行の直前に挿入（または末尾追加）
      state.selectedChipIds.add(chip.id);
      if (chipEl) chipEl.classList.add('active');

      val = val.trim();
      if (!val) {
        aiPromptInput.value = `【背景プロンプト指示】\n${bullet}\n・アスペクト比は縦長の ${state.aspectRatio}（トレーディングカード比率）で生成してください。`;
      } else if (!val.includes(text)) {
        const aspectMarker = 'アスペクト比は縦長の';
        if (val.includes(aspectMarker)) {
          const lines = val.split('\n');
          const aspectIndex = lines.findIndex(l => l.includes(aspectMarker));
          if (aspectIndex !== -1) {
            lines.splice(aspectIndex, 0, bullet);
            aiPromptInput.value = lines.join('\n');
          } else {
            aiPromptInput.value = val + '\n' + bullet;
          }
        } else {
          aiPromptInput.value = val + '\n' + bullet;
        }
      }
      Logger.info(`背景プロンプトチップ追加 [${chip.category}]: ${text}`);
    }

    state.aiPrompt = aiPromptInput.value;
    autoResizePromptTextarea(aiPromptInput);
    saveState();
  }

  // 🌟 背景テキストエリアの手動編集内容からチップのON/OFF（点灯/消灯）を動的同期
  function syncBackgroundChipsFromTextarea() {
    if (!aiPromptInput) return;
    const val = aiPromptInput.value;
    state.chips.forEach(chip => {
      const chipBtns = document.querySelectorAll(`.word-chip[data-chip-id="${chip.id}"]`);
      if (val.includes(chip.text)) {
        state.selectedChipIds.add(chip.id);
        chipBtns.forEach(b => b.classList.add('active'));
      } else {
        state.selectedChipIds.delete(chip.id);
        chipBtns.forEach(b => b.classList.remove('active'));
      }
    });
  }

  // 🌟 比率変更時：ユーザーの手動入力を壊さず、比率行のみを更新
  function updateAspectRatioInPrompt() {
    if (!aiPromptInput) return;
    const newRatioLine = `・アスペクト比は縦長の ${state.aspectRatio}（トレーディングカード比率）で生成してください。`;
    let val = aiPromptInput.value;
    if (/・?アスペクト比は縦長の.*$/m.test(val)) {
      val = val.replace(/・?アスペクト比は縦長の.*$/m, newRatioLine);
    } else {
      val = val.trim() + '\n' + newRatioLine;
    }
    aiPromptInput.value = val;
    state.aiPrompt = val;
    autoResizePromptTextarea(aiPromptInput);
  }

  function updateCombinedPrompt(force = false) {
    if (!force && aiPromptInput && aiPromptInput.value.trim().length > 0) {
      syncBackgroundChipsFromTextarea();
      autoResizePromptTextarea(aiPromptInput);
      return;
    }

    const selectedTexts = [];
    const catKeys = Object.keys(state.categories);

    catKeys.forEach(cat => {
      state.chips
        .filter(c => c.category === cat && state.selectedChipIds.has(c.id) && c.isVisible && !state.deletedChipIds.has(c.id))
        .forEach(c => selectedTexts.push(c.text));
    });

    selectedTexts.push(`アスペクト比は縦長の ${state.aspectRatio}（トレーディングカード比率）で生成してください。`);

    const fullPrompt = '【背景プロンプト指示】\n・' + selectedTexts.join('\n・');
    state.aiPrompt = fullPrompt;
    if (aiPromptInput) {
      aiPromptInput.value = fullPrompt;
      autoResizePromptTextarea(aiPromptInput);
    }
    syncBackgroundChipsFromTextarea();
  }

  // --- 辞書マネージャー ---
  function setupDictManager() {
    const btnQuickOpen = document.getElementById('btnQuickOpenDict');
    const btnClose = document.getElementById('btnCloseDictManager');
    const btnCloseBottom = document.getElementById('btnCloseDictModalBottom');
    const btnShowAll = document.getElementById('btnShowAllChips');

    if (btnQuickOpen) {
      btnQuickOpen.addEventListener('click', () => {
        renderCategoryInputs();
        renderDictCategorySelect();
        renderDictManagerList();
        dictManagerModal.classList.remove('hidden');
      });
    }

    [btnClose, btnCloseBottom].forEach(btn => {
      if (btn) btn.addEventListener('click', () => dictManagerModal.classList.add('hidden'));
    });

    if (btnShowAll) {
      btnShowAll.addEventListener('click', () => {
        state.chips.forEach(c => c.isVisible = true);
        saveState();
        renderDictManagerList();
        renderDynamicChipGroups();
        updateCombinedPrompt();
      });
    }

    const btnAddModal = document.getElementById('btnDictManagerAdd');
    const inputModal = document.getElementById('dictManagerInput');
    const catSelect = document.getElementById('dictManagerCategory');

    if (btnAddModal && inputModal) {
      btnAddModal.addEventListener('click', () => {
        const text = inputModal.value.trim();
        if (!text) return;
        addSingleChip(text, catSelect.value || 'custom');
        inputModal.value = '';
        renderDictManagerList();
      });
    }

    const btnQuickAdd = document.getElementById('btnAddCustomChip');
    const quickInput = document.getElementById('newChipInput');
    if (btnQuickAdd && quickInput) {
      btnQuickAdd.addEventListener('click', () => {
        const text = quickInput.value.trim();
        if (!text) return;
        addSingleChip(text, 'custom');
        quickInput.value = '';
      });
    }
  }

  function renderCategoryInputs() {
    const grid = document.getElementById('categoryInputsGrid');
    if (!grid) return;

    grid.innerHTML = Object.keys(state.categories).map(key => `
      <div class="category-input-row" style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
        <label style="font-size:10px; width:70px; color:var(--gold-text);">${key}:</label>
        <input type="text" value="${Logger.escapeHtml(state.categories[key])}" data-cat-key="${key}">
      </div>
    `).join('');

    grid.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const catKey = e.target.dataset.catKey;
        const newName = e.target.value.trim();
        if (newName) {
          state.categories[catKey] = newName;
          saveState();
          renderDictCategorySelect();
          renderDictManagerList();
          renderDynamicChipGroups();
          updateCombinedPrompt();
        }
      });
    });
  }

  function renderDictCategorySelect() {
    const select = document.getElementById('dictManagerCategory');
    if (!select) return;
    select.innerHTML = Object.keys(state.categories).map(k => `
      <option value="${k}">${Logger.escapeHtml(state.categories[k])}</option>
    `).join('');
  }

  function renderDictManagerList() {
    const listEl = document.getElementById('dictItemList');
    const countEl = document.getElementById('dictTotalCountTag');
    if (!listEl) return;

    const activeChips = state.chips.filter(c => !state.deletedChipIds.has(c.id));
    if (countEl) countEl.textContent = `${activeChips.length} 件`;
    const catKeys = Object.keys(state.categories);

    listEl.innerHTML = activeChips.map((chip) => {
      const optionsHtml = catKeys.map(k => `
        <option value="${k}" ${chip.category === k ? 'selected' : ''}>${Logger.escapeHtml(state.categories[k])}</option>
      `).join('');

      return `
        <div class="dict-item-row" style="display:flex; gap:6px; margin-bottom:4px; align-items:center;">
          <select class="dict-item-cat-select" data-id="${chip.id}" style="width:120px;">
            ${optionsHtml}
          </select>
          <input type="text" class="dict-item-input" value="${Logger.escapeHtml(chip.text)}" data-id="${chip.id}">
          <button type="button" class="btn-secondary btn-sm" data-action="toggle-vis" data-id="${chip.id}">${chip.isVisible ? '表示' : '非表示'}</button>
          <button type="button" class="btn-secondary btn-sm" data-action="del" data-id="${chip.id}" style="color:#ef5350;">✕</button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.dict-item-cat-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const target = state.chips.find(c => c.id === id);
        if (target) {
          target.category = e.target.value;
          saveState();
          renderDynamicChipGroups();
          updateCombinedPrompt();
        }
      });
    });

    listEl.querySelectorAll('.dict-item-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const target = state.chips.find(c => c.id === id);
        if (target) {
          target.text = e.target.value.trim();
          saveState();
          renderDynamicChipGroups();
          updateCombinedPrompt();
        }
      });
    });

    listEl.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const target = state.chips.find(c => c.id === id);
        if (!target) return;

        if (action === 'toggle-vis') {
          target.isVisible = !target.isVisible;
          saveState();
          renderDictManagerList();
          renderDynamicChipGroups();
          updateCombinedPrompt();
        } else if (action === 'del') {
          deleteChip(id);
          renderDictManagerList();
        }
      });
    });
  }

  function addSingleChip(text, category = 'custom') {
    const existing = state.chips.find(c => c.text === text);
    if (existing) {
      existing.isVisible = true;
      existing.category = category;
      state.deletedChipIds.delete(existing.id);
      state.selectedChipIds.add(existing.id);
    } else {
      const newChip = {
        id: 'c_cus_' + Date.now() + Math.floor(Math.random()*100),
        category: category,
        text: text,
        isVisible: true,
        isCustom: true
      };
      state.chips.push(newChip);
      state.selectedChipIds.add(newChip.id);
    }
    saveState(true);
    renderDynamicChipGroups();
    updateCombinedPrompt();
    Logger.success(`単語を追加しました: ${text}`);
  }

  function deleteChip(chipId) {
    const chip = state.chips.find(c => c.id === chipId);
    if (!chip) return;
    if (confirm(`「${chip.text}」を削除しますか？`)) {
      state.deletedChipIds.add(chipId);
      state.selectedChipIds.delete(chipId);
      state.chips = state.chips.filter(c => c.id !== chipId);
      saveState(true);
      renderDynamicChipGroups();
      updateCombinedPrompt();
      Logger.success(`単語を削除しました (墓石登録): ${chip.text}`);
    }
  }

  // --- タブ・サブルート切替制御 (v4.34.0 編集アコーディオン展開対応) ---
  function switchTab(tabId, subtabId = null) {
    // 編集タブ内のサブタブが直接tabIdとして指定された場合の自動解決
    if (['tab-prompt-builder', 'tab-ai-letters', 'tab-spec-edit'].includes(tabId)) {
      subtabId = tabId;
      tabId = 'tab-editor';
    }

    // 1. メインタブ切替 (レールボタン及び全タブボタンの同期)
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    // 2. 編集タブ内のサブタブ切替 (レールアコーディオン及びサブボタン・ピルの同期)
    const accordion = document.getElementById('railSubAccordion');
    const accordionWrapper = document.getElementById('railEditorAccordionWrapper');

    if (tabId === 'tab-editor') {
      // 🌟 アコーディオンをスムーズに開く（すでに開いている場合は維持）
      if (accordion) accordion.classList.add('open');
      if (accordionWrapper) accordionWrapper.classList.add('open');

      if (!subtabId) {
        const currentActivePill = document.querySelector('.subtab-pill.active');
        subtabId = currentActivePill ? currentActivePill.dataset.subtab : 'tab-prompt-builder';
      }

      document.querySelectorAll('.subtab-pill').forEach(b => {
        b.classList.toggle('active', b.dataset.subtab === subtabId);
      });
      document.querySelectorAll('.subtab-pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById(subtabId);
      if (targetPane) targetPane.classList.add('active');

      // サブタブに応じたUI自動更新
      if (subtabId === 'tab-prompt-builder') {
        setTimeout(() => autoResizePromptTextarea(aiPromptInput), 20);
      } else if (subtabId === 'tab-ai-letters') {
        setTimeout(() => {
          ['brandAiPromptInput', 'kanjiAiPromptInput', 'romajiAiPromptInput'].forEach(id => {
            const el = document.getElementById(id);
            if (el) autoResizePromptTextarea(el);
          });
        }, 20);
      }
    } else {
      // 🌟 「解析」「保存」「設定」など他のタブが選ばれた時はスムーズに折りたたむ
      if (accordion) accordion.classList.remove('open');
      if (accordionWrapper) accordionWrapper.classList.remove('open');
    }
  }

  // --- イベントリスナー設定 ---
  function setupEventListeners() {
    // メインタブ切替
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    // 編集サブタブ切替
    document.querySelectorAll('.subtab-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        switchTab('tab-editor', pill.dataset.subtab);
      });
    });

    // 🌟 右1レール: クイックPNG出力ボタン
    const railBtnQuickSave = document.getElementById('railBtnQuickSave');
    if (railBtnQuickSave) {
      railBtnQuickSave.addEventListener('click', () => {
        const btnDownloadMerged = document.getElementById('btnDownloadMerged');
        if (btnDownloadMerged) {
          btnDownloadMerged.click();
        }
      });
    }

    if (btnQuickToggleKey) {
      btnQuickToggleKey.addEventListener('click', () => {
        state.activeKeyMode = state.activeKeyMode === 'free' ? 'paid' : 'free';
        saveApiKeyVault();
        updateKeyToggleUI();
        Logger.info(`APIキーモード変更: ${state.activeKeyMode === 'paid' ? '有料キー' : '無料キー'}`);
      });
    }

    const btnOpenModal = document.getElementById('btnOpenApiKeyModal');
    const btnCloseModal = document.getElementById('btnCloseApiKeyModal');
    const btnCancelModal = document.getElementById('btnCancelApiKey');
    const btnSaveModal = document.getElementById('btnSaveApiKey');

    if (btnOpenModal) {
      btnOpenModal.addEventListener('click', () => {
        if (freeApiKeyInput) freeApiKeyInput.value = state.freeApiKey || '';
        if (paidApiKeyInput) paidApiKeyInput.value = state.paidApiKey || '';
        apiKeyModal.classList.remove('hidden');
      });
    }

    [btnCloseModal, btnCancelModal].forEach(btn => {
      if (btn) btn.addEventListener('click', () => apiKeyModal.classList.add('hidden'));
    });

    if (btnSaveModal) {
      btnSaveModal.addEventListener('click', () => {
        state.freeApiKey = (freeApiKeyInput ? freeApiKeyInput.value : '').trim();
        state.paidApiKey = (paidApiKeyInput ? paidApiKeyInput.value : '').trim();
        saveApiKeyVault();
        updateKeyToggleUI();
        apiKeyModal.classList.add('hidden');
        Logger.success('Gemini APIキーを端末の永久金庫に保存しました。', {
          savedSlot1_freeKey: maskApiKey(state.freeApiKey),
          savedSlot2_paidKey: maskApiKey(state.paidApiKey),
          activeMode: state.activeKeyMode === 'paid' ? '有料キー' : '無料キー'
        });
        alert('🎉 APIキーを端末内の永久金庫に保存しました！');
      });
    }

    const btnOpenLog = document.getElementById('btnOpenLogModal');
    const btnFloatingLocalhost = document.getElementById('btnFloatingLocalhost');
    const btnCloseLog = document.getElementById('btnCloseLogModal');
    const btnClearLogs = document.getElementById('btnClearLogs');
    const btnCopyLogs = document.getElementById('btnCopyLogs');

    if (btnOpenLog) {
      btnOpenLog.addEventListener('click', () => {
        Logger.updateUI();
        logModal.classList.remove('hidden');
      });
    }

    if (btnFloatingLocalhost) {
      btnFloatingLocalhost.addEventListener('click', () => {
        Logger.updateUI();
        logModal.classList.remove('hidden');
      });
    }

    if (btnCloseLog) btnCloseLog.addEventListener('click', () => logModal.classList.add('hidden'));
    if (btnClearLogs) btnClearLogs.addEventListener('click', () => Logger.clear());
    if (btnCopyLogs) {
      btnCopyLogs.addEventListener('click', () => {
        const text = Logger.getAllText();
        navigator.clipboard.writeText(text).then(() => {
          btnCopyLogs.textContent = 'コピー完了！';
          setTimeout(() => { btnCopyLogs.textContent = 'ログを全件コピー'; }, 2000);
        });
      });
    }

    // 🌟 生成ボタン群 ＆ プロンプト即時全行リサイズ
    const btnGenAi = document.getElementById('btnGenerateAiBg');
    if (btnGenAi) btnGenAi.addEventListener('click', () => generateAiBackground());

    if (aiPromptInput) {
      aiPromptInput.addEventListener('input', () => {
        state.aiPrompt = aiPromptInput.value;
        autoResizePromptTextarea(aiPromptInput);
        syncBackgroundChipsFromTextarea();
        saveState();
      });
    }

    const btnCopyPrompt = document.getElementById('btnCopyCombinedPrompt');
    if (btnCopyPrompt && aiPromptInput) {
      btnCopyPrompt.addEventListener('click', () => {
        const text = aiPromptInput.value.trim();
        if (!text) {
          alert('コピーするプロンプトがありません。');
          return;
        }
        navigator.clipboard.writeText(text).then(() => {
          const originalText = btnCopyPrompt.textContent;
          btnCopyPrompt.textContent = 'コピーしました！';
          setTimeout(() => { btnCopyPrompt.textContent = originalText; }, 1800);
        }).catch(() => {
          aiPromptInput.select();
          document.execCommand('copy');
          alert('プロンプトをクリップボードにコピーしました！');
        });
      });
    }

    const btnGenBrand = document.getElementById('btnGenBrandAiGraphic');
    if (btnGenBrand) btnGenBrand.addEventListener('click', () => generateAiTextGraphic('brand'));

    const btnGenKanji = document.getElementById('btnGenKanjiAiGraphic');
    if (btnGenKanji) btnGenKanji.addEventListener('click', () => generateAiTextGraphic('kanji'));

    const btnGenRomaji = document.getElementById('btnGenRomajiAiGraphic');
    if (btnGenRomaji) btnGenRomaji.addEventListener('click', () => generateAiTextGraphic('romaji'));

    // スライダーバインド: レイヤー1 (ブランド)
    bindInput('brandText', (val) => { state.layers.brand.text = val; });
    bindCheckbox('brandRedInitial', (val) => { state.layers.brand.redInitial = val; });
    bindSlider('brandYOffset', (val) => { state.layers.brand.y = parseInt(val, 10); setVal('brandYVal', val + '%'); });
    bindSlider('brandXOffset', (val) => { state.layers.brand.x = parseInt(val, 10); setVal('brandXVal', val + 'px'); });
    bindSlider('brandScale', (val) => { state.layers.brand.scale = parseInt(val, 10); setVal('brandScaleVal', val + '%'); });
    bindSlider('brandOpacity', (val) => { state.layers.brand.opacity = parseInt(val, 10); setVal('brandOpacityVal', val + '%'); });

    // スライダーバインド: レイヤー2 (メイン漢字)
    bindInput('kanjiText', (val) => { state.layers.kanji.text = val; });
    bindInput('kanjiFont', (val) => { state.layers.kanji.font = val; });
    bindSlider('kanjiYOffset', (val) => { state.layers.kanji.y = parseInt(val, 10); setVal('kanjiYVal', val + '%'); });
    bindSlider('kanjiXOffset', (val) => { state.layers.kanji.x = parseInt(val, 10); setVal('kanjiXVal', val + 'px'); });
    bindSlider('kanjiScale', (val) => { state.layers.kanji.scale = parseInt(val, 10); setVal('kanjiScaleVal', val + '%'); });
    bindSlider('kanjiOpacity', (val) => { state.layers.kanji.opacity = parseInt(val, 10); setVal('kanjiOpacityVal', val + '%'); });

    // スライダーバインド: レイヤー3 (英字)
    bindInput('romajiText', (val) => { state.layers.romaji.text = val; });
    bindInput('romajiFont', (val) => { state.layers.romaji.font = val; });
    bindSlider('romajiYOffset', (val) => { state.layers.romaji.y = parseInt(val, 10); setVal('romajiYVal', val + '%'); });
    bindSlider('romajiXOffset', (val) => { state.layers.romaji.x = parseInt(val, 10); setVal('romajiXVal', val + 'px'); });
    bindSlider('romajiScale', (val) => { state.layers.romaji.scale = parseInt(val, 10); setVal('romajiScaleVal', val + '%'); });
    bindSlider('romajiOpacity', (val) => { state.layers.romaji.opacity = parseInt(val, 10); setVal('romajiOpacityVal', val + '%'); });

    // スライダーバインド: レイヤー4 (スペック)
    bindInput('ownerLabelText', (val) => {
      if (!state.layers.specs.ownerLabel) state.layers.specs.ownerLabel = {};
      state.layers.specs.ownerLabel.text = val;
    });
    bindInput('ownerLabelFontSelect', (val) => {
      if (!state.layers.specs.ownerLabel) state.layers.specs.ownerLabel = {};
      state.layers.specs.ownerLabel.font = val;
    });
    bindSlider('ownerLabelSize', (val) => {
      if (!state.layers.specs.ownerLabel) state.layers.specs.ownerLabel = {};
      state.layers.specs.ownerLabel.size = parseInt(val, 10);
      setVal('ownerLabelSizeVal', val + 'px');
    });
    bindSlider('ownerLabelYOffset', (val) => {
      if (!state.layers.specs.ownerLabel) state.layers.specs.ownerLabel = {};
      state.layers.specs.ownerLabel.y = parseInt(val, 10);
      setVal('ownerLabelYVal', val + '%');
    });

    bindInput('ownerName', (val) => { state.layers.specs.owner.text = val; });
    bindInput('ownerFontSelect', (val) => { state.layers.specs.owner.font = val; });
    bindSlider('ownerSize', (val) => { state.layers.specs.owner.size = parseInt(val, 10); setVal('ownerSizeVal', val + 'px'); });
    bindSlider('ownerYOffset', (val) => { state.layers.specs.owner.y = parseInt(val, 10); setVal('ownerYVal', val + '%'); });

    bindInput('serialText', (val) => { state.layers.specs.serial.text = val; });
    bindInput('serialFontSelect', (val) => { state.layers.specs.serial.font = val; });
    bindSlider('serialSize', (val) => { state.layers.specs.serial.size = parseInt(val, 10); setVal('serialSizeVal', val + 'px'); });
    bindSlider('serialYOffset', (val) => { state.layers.specs.serial.y = parseInt(val, 10); setVal('serialYVal', val + '%'); });

    bindInput('sizeText', (val) => { state.layers.specs.size.text = val; });
    bindInput('sizeFontSelect', (val) => { state.layers.specs.size.font = val; });
    bindSlider('sizeSize', (val) => { state.layers.specs.size.size = parseInt(val, 10); setVal('sizeSizeVal', val + 'px'); });
    bindSlider('sizeYOffset', (val) => { state.layers.specs.size.y = parseInt(val, 10); setVal('sizeYVal', val + '%'); });

    bindInput('extraInfoText', (val) => { state.layers.specs.extra.text = val; });
    bindInput('extraFontSelect', (val) => { state.layers.specs.extra.font = val; });
    bindSlider('extraSize', (val) => { state.layers.specs.extra.size = parseInt(val, 10); setVal('extraSizeVal', val + 'px'); });
    bindSlider('extraYOffset', (val) => { state.layers.specs.extra.y = parseInt(val, 10); setVal('extraYVal', val + '%'); });

    // 🎨 文字カラー選択 ＆ プリセット (AI文字 & スペック文字)
    const specColorKeys = [
      { id: 'brandColor', getSpec: () => state.layers.brand, def: 'gold' },
      { id: 'kanjiColor', getSpec: () => state.layers.kanji, def: '#111111' },
      { id: 'romajiColor', getSpec: () => state.layers.romaji, def: 'gold' },
      { id: 'ownerLabelColor', getSpec: () => state.layers.specs.ownerLabel, def: '#222222' },
      { id: 'ownerColor', getSpec: () => state.layers.specs.owner, def: '#111111' },
      { id: 'serialColor', getSpec: () => state.layers.specs.serial, def: '#2a2a2a' },
      { id: 'sizeColor', getSpec: () => state.layers.specs.size, def: '#111111' },
      { id: 'extraColor', getSpec: () => state.layers.specs.extra, def: '#444444' }
    ];

    specColorKeys.forEach(({ id, getSpec, def }) => {
      const colorInput = document.getElementById(id);
      if (colorInput) {
        const handleColorChange = (e) => {
          const spec = getSpec();
          if (spec) {
            spec.color = e.target.value;
            const chipGroup = document.querySelector(`.color-preset-chips[data-target="${id}"]`);
            if (chipGroup) {
              chipGroup.querySelectorAll('.btn-color-chip').forEach(c => {
                c.classList.toggle('active', c.dataset.color.toLowerCase() === spec.color.toLowerCase());
              });
            }
            saveState();
            renderCard();
          }
        };
        colorInput.addEventListener('input', handleColorChange);
        colorInput.addEventListener('change', handleColorChange);
      }
    });

    document.querySelectorAll('.color-preset-chips .btn-color-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const container = chip.closest('.color-preset-chips');
        if (!container) return;
        const targetId = container.dataset.target;
        const specKeyObj = specColorKeys.find(k => k.id === targetId);
        if (!specKeyObj) return;

        const spec = specKeyObj.getSpec();
        if (!spec) return;

        const selectedColor = chip.dataset.color;
        spec.color = selectedColor;

        container.querySelectorAll('.btn-color-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const colorInput = document.getElementById(targetId);
        if (colorInput) {
          if (selectedColor === 'gold') {
            colorInput.value = '#d4af37';
          } else if (/^#[0-9a-fA-F]{6}$/.test(selectedColor)) {
            colorInput.value = selectedColor;
          }
        }

        saveState();
        renderCard();
      });
    });

    // 🌫️ 文字エフェクト（白い霧 ＆ 影 ＆ ぼかし強度）リスナー (AI文字 & スペック文字)
    const specItems = [
      { key: 'brand', getSpec: () => state.layers.brand },
      { key: 'kanji', getSpec: () => state.layers.kanji },
      { key: 'romaji', getSpec: () => state.layers.romaji },
      { key: 'ownerLabel', getSpec: () => state.layers.specs.ownerLabel },
      { key: 'owner', getSpec: () => state.layers.specs.owner },
      { key: 'serial', getSpec: () => state.layers.specs.serial },
      { key: 'size', getSpec: () => state.layers.specs.size },
      { key: 'extra', getSpec: () => state.layers.specs.extra }
    ];

    document.querySelectorAll('.btn-fx-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetKey = btn.dataset.target;
        const fxType = btn.dataset.fx; // 'glow' or 'shadow'
        const item = specItems.find(i => i.key === targetKey);
        if (!item) return;
        const spec = item.getSpec();
        if (!spec) return;

        spec[fxType] = !spec[fxType];

        btn.classList.toggle('active', !!spec[fxType]);
        const tag = btn.querySelector('.fx-state-tag');
        if (tag) tag.textContent = spec[fxType] ? 'ON' : 'OFF';

        if (fxType === 'glow') {
          const glowRow = document.getElementById(`${targetKey}GlowRow`);
          if (glowRow) glowRow.classList.toggle('hidden', !spec.glow);
        }

        saveState();
        renderCard();
      });
    });

    specItems.forEach(({ key, getSpec }) => {
      bindSlider(`${key}GlowBlur`, (val) => {
        const spec = getSpec();
        if (spec) {
          spec.glowBlur = parseInt(val, 10);
          setVal(`${key}GlowBlurVal`, val + 'px');
        }
      });
    });

    // ↺ 標準フォント復元ボタン（AIグラフィック解除）
    ['Brand', 'Kanji', 'Romaji'].forEach(name => {
      const lower = name.toLowerCase();
      const btn = document.getElementById(`btnResetToFont${name}`);
      if (btn) {
        btn.addEventListener('click', async () => {
          HistoryManager.recordState();
          state.layers[lower].aiGraphicDataUrl = null;
          await reloadAllLayerImages();
          syncInputsFromState();
          saveState();
          renderCard();
          Logger.info(`↺ ${name}レイヤーを標準文字描画に復元しました。`);
        });
      }
    });

    // ↩️ アンドゥ (戻る) ボタン ＆ キーボードショートカット (Cmd+Z / Ctrl+Z)
    const handleUndo = (e) => {
      if (e) e.preventDefault();
      HistoryManager.undo();
    };
    const btnUndo = document.getElementById('btnUndo');
    if (btnUndo) btnUndo.addEventListener('click', handleUndo);
    const railBtnUndo = document.getElementById('railBtnUndo');
    if (railBtnUndo) railBtnUndo.addEventListener('click', handleUndo);

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' && document.activeElement.type === 'text') return;
        if (activeTag === 'TEXTAREA') return;
        e.preventDefault();
        HistoryManager.undo();
      }
    });

    document.querySelectorAll('.ratio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.aspectRatio = btn.dataset.ratio;
        state.aiAspectRatio = btn.dataset.aiRatio || '3:4';
        state.canvasWidth = parseInt(btn.dataset.w, 10);
        state.canvasHeight = parseInt(btn.dataset.h, 10);
        ratioBadge.textContent = `比率: ${btn.dataset.ratio}`;
        resBadge.textContent = `${state.canvasWidth} × ${state.canvasHeight} px`;
        
        const pw = document.getElementById('previewWrapper');
        if (pw && state.aspectRatio) {
          pw.style.aspectRatio = state.aspectRatio.replace(':', ' / ');
        }

        updateAspectRatioInPrompt();
        saveState();
        renderCard();
      });
    });

    document.getElementById('btnRerender').addEventListener('click', () => renderCard());

    // 📐 印刷キャリブレーション ＆ 安全枠ガイド HUD (v4.15.0)
    const btnToggleCalib = document.getElementById('btnToggleCalibration') || document.getElementById('btnSetCalibrationBg');
    if (btnToggleCalib) {
      btnToggleCalib.addEventListener('click', () => {
        state.showCalibrationOverlay = !state.showCalibrationOverlay;
        btnToggleCalib.classList.toggle('active', !!state.showCalibrationOverlay);
        btnToggleCalib.textContent = state.showCalibrationOverlay ? '📐 スケール表示中' : '📐 測定スケール';
        btnToggleCalib.title = state.showCalibrationOverlay ? 'クリックで測定スケールを非表示にします' : '目盛り・ルーラー測定スケールを画面に重ねて表示（クリックでON/OFF切替）';
        saveState(false);
        renderCard();
        Logger.info(`[CALIBRATION_OVERLAY] 測定スケール表示: ${state.showCalibrationOverlay ? 'ON' : 'OFF'}`);
      });
    }

    const btnClampSafe = document.getElementById('btnClampToSafeZone');
    if (btnClampSafe) {
      btnClampSafe.addEventListener('click', () => clampLayersToSafeZone());
    }

    const toggleSafetyGuide = document.getElementById('toggleSafetyGuide');
    if (toggleSafetyGuide) {
      toggleSafetyGuide.addEventListener('change', (e) => {
        state.showSafetyGuide = e.target.checked;
        updateSafetyStateBadge(state.showSafetyGuide);
        saveState(false);
        renderCard();
        Logger.info(`[SAFETY_GUIDE_TOGGLE] 安全枠ガイド表示: ${state.showSafetyGuide ? 'ON' : 'OFF'} (マージン: ${state.safetyMargin}%)`);
      });
    }

    const safetyMarginInput = document.getElementById('safetyMarginInput');
    if (safetyMarginInput) {
      safetyMarginInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(15, val));
        state.safetyMargin = val;
        saveState(false);
        if (state.showSafetyGuide) renderCard();
      });
    }

    const btnSafetyMarginDec = document.getElementById('btnSafetyMarginDec');
    if (btnSafetyMarginDec) {
      btnSafetyMarginDec.addEventListener('click', () => {
        state.safetyMargin = Math.max(0, (state.safetyMargin !== undefined ? state.safetyMargin : 3) - 1);
        if (safetyMarginInput) safetyMarginInput.value = state.safetyMargin;
        saveState(false);
        if (state.showSafetyGuide) renderCard();
      });
    }

    const btnSafetyMarginInc = document.getElementById('btnSafetyMarginInc');
    if (btnSafetyMarginInc) {
      btnSafetyMarginInc.addEventListener('click', () => {
        state.safetyMargin = Math.min(15, (state.safetyMargin !== undefined ? state.safetyMargin : 3) + 1);
        if (safetyMarginInput) safetyMarginInput.value = state.safetyMargin;
        saveState(false);
        if (state.showSafetyGuide) renderCard();
      });
    }

    const chkExportWithGuide = document.getElementById('chkExportWithGuide');
    if (chkExportWithGuide) {
      chkExportWithGuide.addEventListener('change', (e) => {
        state.exportWithGuide = e.target.checked;
      });
    }

    document.getElementById('btnResetSample').addEventListener('click', () => {
      state.layers.brand.text = 'LOJING';
      state.layers.brand.redInitial = true;
      state.layers.brand.color = 'gold';
      state.layers.brand.shadow = false;
      state.layers.brand.glow = false;
      state.layers.brand.glowBlur = 14;

      state.layers.kanji.text = '蒼';
      state.layers.kanji.color = '#111111';
      state.layers.kanji.shadow = false;
      state.layers.kanji.glow = false;
      state.layers.kanji.glowBlur = 14;

      state.layers.romaji.text = 'AOI';
      state.layers.romaji.color = 'gold';
      state.layers.romaji.shadow = false;
      state.layers.romaji.glow = false;
      state.layers.romaji.glowBlur = 14;

      state.layers.specs.ownerLabel = {
        text: 'Owner',
        font: "'Cinzel', serif",
        size: 36,
        y: 74,
        x: 0,
        color: '#222222',
        shadow: false,
        glow: false,
        glowBlur: 14
      };
      state.layers.specs.owner = {
        text: '佃 宗行 様',
        font: "'Hiragino Mincho ProN', serif",
        size: 62,
        y: 78,
        x: 0,
        color: '#111111',
        shadow: false,
        glow: false,
        glowBlur: 14
      };
      state.layers.specs.serial.text = 'NO.AS-05';
      state.layers.specs.serial.color = '#2a2a2a';
      state.layers.specs.serial.shadow = false;
      state.layers.specs.serial.glow = false;
      state.layers.specs.serial.glowBlur = 14;

      state.layers.specs.size.text = '♂77mm';
      state.layers.specs.size.color = '#111111';
      state.layers.specs.size.shadow = false;
      state.layers.specs.size.glow = false;
      state.layers.specs.size.glowBlur = 14;

      state.layers.specs.extra.text = '';
      state.layers.specs.extra.color = '#444444';
      state.layers.specs.extra.shadow = false;
      state.layers.specs.extra.glow = false;
      state.layers.specs.extra.glowBlur = 14;

      syncInputsFromState();
      saveState();
      renderCard();
    });

    document.getElementById('btnDownloadMerged').addEventListener('click', () => exportLayer('merged'));
    document.getElementById('btnDownloadBg').addEventListener('click', () => exportLayer('bg'));
    document.getElementById('btnDownloadText').addEventListener('click', () => exportLayer('text'));

    const btnSaveArchive = document.getElementById('btnSaveToArchive');
    if (btnSaveArchive) {
      btnSaveArchive.addEventListener('click', () => saveCurrentToArchive());
    }
  }

  function bindInput(id, callback) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        callback(e.target.value);
        saveState();
        renderCard();
      });
    }
  }

  function bindCheckbox(id, callback) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        callback(e.target.checked);
        saveState();
        renderCard();
      });
    }
  }

  function bindSlider(id, callback) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        callback(e.target.value);
        saveState();
        renderCard();
      });
    }
  }

  // --- 👁️ Vision AI & AI消しゴム: 窓1（プロンプト抽出）＆ 窓2（文字・菱形消去） (v4.23.0) ---
  function setupVisionDropZone() {
    // 🌟 窓1: 背景プロンプト抽出ゾーン
    const promptZone = document.getElementById('promptExtractDropZone');
    const promptInput = document.getElementById('promptExtractFileInput');
    if (promptZone && promptInput) {
      promptZone.addEventListener('click', (e) => {
        if (e.target === promptInput) return;
        promptInput.value = '';
        Logger.info('🖱️ [UI_CLICK] 窓1（プロンプト抽出枠）をクリック ➔ ファイル選択ダイアログを開きます');
        promptInput.click();
      });

      promptInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      promptInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
          Logger.warn('[FILE_SELECT] 窓1: ファイルが選択されませんでした（キャンセル）');
          return;
        }
        Logger.info(`📁 [FILE_SELECT] 窓1: 画像ファイル選択検知: ${file.name}`, {
          sizeBytes: file.size,
          sizeKB: Math.round(file.size / 1024),
          mimeType: file.type || 'unknown',
          lastModified: file.lastModified
        });
        extractPromptFromImage(file);
        promptInput.value = '';
      });

      ['dragenter', 'dragover'].forEach(n => {
        promptZone.addEventListener(n, (e) => {
          e.preventDefault();
          e.stopPropagation();
          promptZone.classList.add('dragover');
        });
      });
      ['dragleave'].forEach(n => {
        promptZone.addEventListener(n, (e) => {
          e.preventDefault();
          e.stopPropagation();
          promptZone.classList.remove('dragover');
        });
      });
      promptZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        promptZone.classList.remove('dragover');

        let file = null;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          file = e.dataTransfer.files[0];
        } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          const item = e.dataTransfer.items[0];
          if (item.kind === 'file') file = item.getAsFile();
        }

        if (file) {
          Logger.info(`📥 [FILE_DROP] 窓1: 画像ファイルドロップ検知: ${file.name}`, {
            sizeBytes: file.size,
            sizeKB: Math.round(file.size / 1024),
            mimeType: file.type || 'unknown'
          });
          extractPromptFromImage(file);
        } else {
          Logger.warn('[FILE_DROP] 窓1: ドロップデータ内に有効な画像ファイルが見つかりませんでした');
        }
      });
    }

    // 🌟 窓2: 文字＆右下菱形消去ゾーン
    const cleanZone = document.getElementById('cleanBgDropZone');
    const cleanInput = document.getElementById('cleanBgFileInput');
    if (cleanZone && cleanInput) {
      cleanZone.addEventListener('click', (e) => {
        if (e.target === cleanInput) return;
        cleanInput.value = '';
        Logger.info('🖱️ [UI_CLICK] 窓2（文字消去枠）をクリック ➔ ファイル選択ダイアログを開きます');
        cleanInput.click();
      });

      cleanInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      cleanInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
          Logger.warn('[FILE_SELECT] 窓2: ファイルが選択されませんでした（キャンセル）');
          return;
        }
        Logger.info(`📁 [FILE_SELECT] 窓2: 画像ファイル選択検知: ${file.name}`, {
          sizeBytes: file.size,
          sizeKB: Math.round(file.size / 1024),
          mimeType: file.type || 'unknown',
          lastModified: file.lastModified
        });
        eraseTextAndDiamondFromImage(file);
        cleanInput.value = '';
      });

      ['dragenter', 'dragover'].forEach(n => {
        cleanZone.addEventListener(n, (e) => {
          e.preventDefault();
          e.stopPropagation();
          cleanZone.classList.add('dragover');
        });
      });
      ['dragleave'].forEach(n => {
        cleanZone.addEventListener(n, (e) => {
          e.preventDefault();
          e.stopPropagation();
          cleanZone.classList.remove('dragover');
        });
      });
      cleanZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cleanZone.classList.remove('dragover');

        let file = null;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          file = e.dataTransfer.files[0];
        } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          const item = e.dataTransfer.items[0];
          if (item.kind === 'file') file = item.getAsFile();
        }

        if (file) {
          Logger.info(`📥 [FILE_DROP] 窓2: 画像ファイルドロップ検知: ${file.name}`, {
            sizeBytes: file.size,
            sizeKB: Math.round(file.size / 1024),
            mimeType: file.type || 'unknown'
          });
          eraseTextAndDiamondFromImage(file);
        } else {
          Logger.warn('[FILE_DROP] 窓2: ドロップデータ内に有効な画像ファイルが見つかりませんでした');
        }
      });
    }

    const btnApplyClean = document.getElementById('btnApplyCleanBg');
    if (btnApplyClean) {
      btnApplyClean.addEventListener('click', async () => {
        if (!state.lastCleanBgUrl) {
          Logger.warn('[APPLY_CLEAN_BG] 適用対象の復元背景URLが存在しません');
          alert('適用する復元背景がありません。先に画像をドロップして文字消去を行ってください。');
          return;
        }

        Logger.info('[APPLY_CLEAN_BG] 復元された文字なし背景をスタジオに適用開始', {
          urlLength: state.lastCleanBgUrl.length,
          isDataUrl: state.lastCleanBgUrl.startsWith('data:')
        });

        try {
          state.layers.bg.src = state.lastCleanBgUrl;
          await loadBgImage(state.lastCleanBgUrl);
          await saveState(true);
          renderCard();

          Logger.success('🎉 [APPLY_CLEAN_BG] 復元された文字なし背景をスタジオキャンバスに適用しました', {
            bgSrcType: state.layers.bg.src.startsWith('data:') ? 'base64' : 'url',
            cardTitle: state.cardTitle || '未設定'
          });

          alert('🎉 復元された文字なし背景をスタジオに適用しました！文字入れスタジオへ移動します。');
          switchTab('tab-editor', 'tab-ai-letters');
        } catch (err) {
          Logger.error('[APPLY_CLEAN_BG] 背景適用処理エラー', err.message);
          alert('背景の適用中にエラーが発生しました: ' + err.message);
        }
      });
    }

    const btnApplyBuilder = document.getElementById('btnApplyExtractedToBuilder');
    if (btnApplyBuilder) {
      btnApplyBuilder.addEventListener('click', () => {
        if (!state.lastExtractedPrompt) return;
        aiPromptInput.value = state.lastExtractedPrompt.ja;
        state.aiPrompt = state.lastExtractedPrompt.ja;
        autoResizePromptTextarea(aiPromptInput);
        saveState();
        switchTab('tab-editor', 'tab-prompt-builder');
      });
    }

    const btnCopyExt = document.getElementById('btnCopyExtractedPrompt');
    if (btnCopyExt) {
      btnCopyExt.addEventListener('click', () => {
        if (!state.lastExtractedPrompt) return;
        navigator.clipboard.writeText(state.lastExtractedPrompt.ja).then(() => {
          btnCopyExt.textContent = 'コピー完了！';
          setTimeout(() => { btnCopyExt.textContent = 'コピー'; }, 2000);
        });
      });
    }

    const btnSaveLib = document.getElementById('btnSaveToLibrary');
    if (btnSaveLib) {
      btnSaveLib.addEventListener('click', () => {
        if (!state.lastExtractedPrompt) return;
        const rawJa = state.lastExtractedPrompt.ja || '';
        const rawSegments = rawJa.split(/[、,\n・]/);
        const ignoreList = ['文字なし', 'ロゴなし', '最高品質', '8K解像度', '純粋な背景グラフィック', '8K', '高解像度', ''];

        const validPhrases = rawSegments
          .map(s => s.trim().replace(/^・/, ''))
          .filter(s => s.length >= 2 && !ignoreList.includes(s));

        validPhrases.forEach(phrase => addSingleChip(phrase, 'custom'));
        alert(`以下の ${validPhrases.length} 件の単語パーツに分割して辞書に登録しました！\n\n・` + validPhrases.join('\n・'));
      });
    }
  }

  // 🌟 窓1: 画像から背景プロンプト抽出（Vision AI）
  async function extractPromptFromImage(file) {
    const keyInfo = getEffectiveApiKeyInfo('text');
    const apiKey = keyInfo.key;
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('画像解析を行うために、右上の「API設定」からAPIキーを入力してください。');
      return;
    }

    const promptArea = document.getElementById('visionResultArea');
    const loadingInline = document.getElementById('promptExtractLoadingInline');
    const uploadPrompt = document.getElementById('promptExtractUploadPrompt');

    if (uploadPrompt) uploadPrompt.classList.add('hidden');
    if (loadingInline) loadingInline.classList.remove('hidden');
    if (promptArea) promptArea.classList.add('hidden');

    showLoading(true, 'Gemini Vision AI が画像を詳細解析＆プロンプト抽出中...');
    Logger.api(`Vision AI 背景プロンプト抽出開始: ${file.name}`, {
      usedSlot: keyInfo.slot,
      usedKey: keyInfo.masked
    });

    try {
      const base64Data = await readFileAsBase64(file);
      const mimeType = file.type || 'image/jpeg';

      const promptInstruction = `あなたは最高峰のトレーディングカード背景デザイナーです。
添付されたカード画像を解析し、印字されている文字（ブランド名、漢字血統名、数字、サイズなど）やロゴマーク（右下の菱形など）をすべて完全に無視・除外して、
その下にある『純粋な背景グラフィック（和紙テクスチャ、中央の水彩グラデーション、金箔散らし、色彩構成）』を完全再現するための詳細プロンプトを出力してください。

必ず以下の有効なJSONフォーマットのみを出力してください（Markdown記法なし）:
{
  "ja": "上質な和紙の質感、中央に透明感のある翡翠色・深緑色の水彩シェイプ、蒔絵風の金箔散らし、文字配置用の中央クリーン構図、文字なし、最高峰コレクターズ品質",
  "en": "luxury washi paper texture, emerald green watercolor shape, golden dust particles, clean center, no typography, 8k"
}`;

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [{
          parts: [
            { text: promptInstruction },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error ? errJson.error.message : `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      let parsed = null;
      try {
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch (pe) {
        parsed = { ja: rawText.split('\n')[0] || rawText, en: '' };
      }

      state.lastExtractedPrompt = parsed;
      document.getElementById('extractedPromptJa').textContent = `日本語: ${parsed.ja}`;
      document.getElementById('extractedPromptEn').textContent = `英語: ${parsed.en}`;

      if (promptArea) promptArea.classList.remove('hidden');
      if (loadingInline) loadingInline.classList.add('hidden');
      if (uploadPrompt) uploadPrompt.classList.remove('hidden');

      showLoading(false);
      Logger.success('Vision AI 背景プロンプト抽出完了');
    } catch (err) {
      if (loadingInline) loadingInline.classList.add('hidden');
      if (uploadPrompt) uploadPrompt.classList.remove('hidden');
      showLoading(false);
      Logger.error('Vision AI 解析例外', err.message);
      alert('解析エラー: ' + err.message);
    }
  }

  // 🌟 窓2: 画像の文字 ＆ 右下菱形マーク消去（AI直接消去・インペインティング）
  async function eraseTextAndDiamondFromImage(file) {
    const keyInfo = getEffectiveApiKeyInfo('image');
    const apiKey = keyInfo.key;
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('APIキーが設定されていません。右レール「⚙️ 設定」の「🔑 APIキーを登録・変更」からAPIキーを入力してください。');
      return;
    }

    const cleanArea = document.getElementById('cleanBgResultArea');
    const loadingInline = document.getElementById('cleanBgLoadingInline');
    const loadingInlineText = document.getElementById('cleanBgLoadingText');
    const uploadPrompt = document.getElementById('cleanBgUploadPrompt');

    if (uploadPrompt) uploadPrompt.classList.add('hidden');
    if (loadingInline) loadingInline.classList.remove('hidden');
    if (cleanArea) cleanArea.classList.add('hidden');

    function updateInpaintProgress(msg) {
      showLoading(true, msg);
      if (loadingInlineText) loadingInlineText.textContent = msg;
    }

    updateInpaintProgress('AI文字消去準備中: 画像データを読み込んでいます...');
    Logger.api(`AI文字＆右下菱形消去開始: ${file.name}`, {
      usedSlot: keyInfo.slot,
      usedKey: keyInfo.masked
    });

    try {
      const base64Data = await readFileAsBase64(file);
      const mimeType = file.type || 'image/jpeg';

      const inpaintInstruction = `You are a master image retouching and inpainting engine.
Perform precise content-aware inpainting on this collector card image:
1. Erase and completely remove ALL foreground text, kanji pedigree names, roman alphabet titles, numbers, labels, specs, and badges.
2. CRITICAL: Erase and completely remove the diamond-shaped emblem/logo/watermark located at the bottom-right corner of the image.
3. Inpaint and restore those cleared regions seamlessly by extending the underlying background texture: authentic Japanese washi paper grain, delicate golden leaf flecks, and soft watercolor gradients.
4. Keep the original background colors, lighting, texture, and composition 100% intact.
Output strictly the pure, clean background image with ZERO text, ZERO characters, and ZERO diamond symbols.`;

      const candidateModels = [
        'gemini-3.1-flash-image',
        'gemini-2.5-flash-image',
        'nano-banana-pro-preview'
      ];

      let generatedCleanUrl = null;
      let lastErr = '';

      for (let i = 0; i < candidateModels.length; i++) {
        const model = candidateModels[i];
        const stepNum = i + 1;
        const totalSteps = candidateModels.length;

        updateInpaintProgress(`AI文字消去中 (ステップ ${stepNum}/${totalSteps}: モデル ${model} 接続中)...`);
        Logger.info(`🎨 [INPAINT_STEP ${stepNum}/${totalSteps}] モデル [${model}] に直接文字・菱形消去リクエスト送信中...`);

        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const payload = {
            contents: [{
              parts: [
                { text: inpaintInstruction },
                { inlineData: { mimeType: mimeType, data: base64Data } }
              ]
            }]
          };

          const resp = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(payload)
          });

          if (resp.ok) {
            const data = await resp.json();
            const parts = data.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                generatedCleanUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                Logger.success(`✨ [INPAINT_SUCCESS] モデル [${model}] で文字および右下菱形の直接消去に成功しました！`);
                break;
              }
            }
            if (generatedCleanUrl) break;
            Logger.info(`ℹ️ [INPAINT_NOTE] モデル [${model}] はテキスト説明を返却したため、次の描画モデルへ引き継ぎます`);
          } else {
            const errJson = await resp.json().catch(() => ({}));
            lastErr = errJson.error ? errJson.error.message : `HTTP ${resp.status}`;
            Logger.warn(`⚠️ [INPAINT_NEXT] モデル [${model}] 試行スキップ: ${lastErr} ➔ 次のモデルへ移行`);
          }
        } catch (e) {
          lastErr = e.message;
          Logger.warn(`⚠️ [INPAINT_ERR] モデル [${model}] 通信例外: ${e.message} ➔ 次のモデルへ移行`);
        }
      }

      // フォールバック: 直接編集APIが非対応/制限の場合、Vision抽出 ➔ クリーン背景生成を実行
      if (!generatedCleanUrl) {
        updateInpaintProgress('AI文字消去中: Vision解析で元画像の和紙・金箔・配色特徴を詳細抽出中...');
        Logger.info('👁️ [ERASE_FALLBACK] 直接消去からVision解析 ➔ 高精度クリーン背景再生成エンジンへ引き継ぎます');

        const visionPrompt = await analyzeBackgroundPromptForInpaint(base64Data, mimeType, apiKey);
        Logger.info(`📝 [VISION_PROMPT_EXTRACTED] 抽出背景プロンプト: ${visionPrompt}`);

        updateInpaintProgress('AI文字消去中: 抽出した和紙・金箔の純粋背景グラフィックを生成中...');
        generatedCleanUrl = await generateCleanBgFromPrompt(visionPrompt, apiKey, updateInpaintProgress);
      }

      if (!generatedCleanUrl) {
        throw new Error(lastErr || '文字消去背景の生成に失敗しました。');
      }

      state.lastCleanBgUrl = generatedCleanUrl;
      const previewImg = document.getElementById('cleanBgPreviewImg');
      if (previewImg) previewImg.src = state.lastCleanBgUrl;

      if (cleanArea) cleanArea.classList.remove('hidden');
      if (loadingInline) loadingInline.classList.add('hidden');
      if (uploadPrompt) uploadPrompt.classList.remove('hidden');

      showLoading(false);
      Logger.success('🎉 AI文字＆右下菱形消去・純粋背景復元完了');
    } catch (err) {
      if (loadingInline) loadingInline.classList.add('hidden');
      if (uploadPrompt) uploadPrompt.classList.remove('hidden');
      showLoading(false);
      Logger.error('AI文字消去例外', err.message);
      alert('文字消去エラー: ' + err.message);
    }
  }

  async function analyzeBackgroundPromptForInpaint(base64Data, mimeType, apiKey) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
      contents: [{
        parts: [
          { text: "Analyze this trading card image. Ignore all text, kanji, numbers, and the bottom-right diamond watermark. Describe only the pure background graphic in detail (washi texture, watercolor gradient, gold leaf). Output one concise English prompt, appending 'clean layout for text, no typography, no diamond watermark, no text'." },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      }]
    };
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'luxury Japanese washi paper, gold foil, watercolor gradient, no typography, no diamond watermark';
    }
    return 'luxury Japanese washi paper, gold foil, watercolor gradient, no typography, no diamond watermark';
  }

  async function generateCleanBgFromPrompt(promptText, apiKey, progressCallback) {
    const candidateModels = [
      'gemini-3.1-flash-image',
      'gemini-3-pro-image',
      'nano-banana-pro-preview',
      'gemini-2.5-flash-image'
    ];
    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      if (progressCallback) {
        progressCallback(`純粋背景生成中 (モデル ${i + 1}/${candidateModels.length}: ${model})...`);
      }
      Logger.info(`🖼️ [CLEAN_BG_ATTEMPT ${i + 1}/${candidateModels.length}] モデル [${model}] で純粋背景グラフィックを生成中...`);

      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const payload = {
          contents: [{
            parts: [{ text: `Generate high resolution card background: ${promptText}. Pure background only, no text, no letters, no logos, no watermark.` }]
          }]
        };
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const data = await resp.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              Logger.success(`✨ [CLEAN_BG_SUCCESS] モデル [${model}] で純粋背景グラフィックの生成に成功しました！`);
              return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
            }
          }
          Logger.info(`ℹ️ [CLEAN_BG_NOTE] モデル [${model}] はテキスト応答のため、次のモデルへ移行`);
        } else {
          Logger.warn(`⚠️ [CLEAN_BG_SKIP] モデル [${model}]: HTTP ${resp.status}`);
        }
      } catch (e) {
        Logger.warn(`⚠️ [CLEAN_BG_ERR] モデル [${model}]: ${e.message}`);
      }
    }
    return null;
  }

  // --- ✨ Gemini AI 文字グラフィック生成エンジン (超高精度クロマキー透過) ---
  async function generateAiTextGraphic(targetLayer) {
    const keyInfo = getEffectiveApiKeyInfo('image');
    const apiKey = keyInfo.key;
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('APIキーが設定されていません。右レール「⚙️ 設定」の「🔑 APIキーを登録・変更」からAPIキーを入力してください。');
      return;
    }

    let text = '';
    let customPrompt = '';

    if (targetLayer === 'brand') {
      text = state.layers.brand.text.trim();
      customPrompt = document.getElementById('brandAiPromptInput')?.value.trim() || '';
    } else if (targetLayer === 'kanji') {
      text = state.layers.kanji.text.trim();
      customPrompt = document.getElementById('kanjiAiPromptInput')?.value.trim() || '';
    } else if (targetLayer === 'romaji') {
      text = state.layers.romaji.text.trim();
      customPrompt = document.getElementById('romajiAiPromptInput')?.value.trim() || '';
    }

    if (!text) {
      alert('生成する文字を入力してください。');
      return;
    }

    showLoading(true, `✨ Gemini が「${text}」の100%完全透過文字グラフィックを生成中...`);
    Logger.api(`AI文字グラフィック生成開始 [${targetLayer}]: ${text}`, {
      layer: targetLayer,
      text: text,
      usedSlot: keyInfo.slot,
      usedKey: keyInfo.masked,
      slot1_freeKey: keyInfo.slot1_masked,
      slot2_paidKey: keyInfo.slot2_masked,
      activeMode: keyInfo.activeMode
    });

    const candidateModels = [
      'gemini-3.1-flash-image',
      'gemini-3-pro-image',
      'nano-banana-pro-preview',
      'gemini-2.5-flash-image'
    ];

    let generatedB64 = null;
    let lastError = '';

    for (const model of candidateModels) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const payload = {
          contents: [{
            parts: [{
              text: `Generate a high resolution luxury typography character logo graphic of the exact word: "${text}". Style and appearance instructions: ${customPrompt}. Requirement: Isolated subject on a pure solid flat pitch-black #000000 background, zero ambient lighting on background, razor-sharp clean edges for automatic transparent cutout.`
            }]
          }]
        };

        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          const data = await resp.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              generatedB64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
          if (generatedB64) break;
        } else {
          const errJson = await resp.json().catch(() => ({}));
          lastError = errJson.error ? errJson.error.message : `HTTP ${resp.status}`;
          Logger.warn(`AI文字グラフィック試行失敗 [${model}]: HTTP ${resp.status}`, {
            model: model,
            status: resp.status,
            usedSlot: keyInfo.slot,
            usedKey: keyInfo.masked,
            error: lastError
          });
        }
      } catch (e) {
        lastError = e.message;
        Logger.warn(`AI文字グラフィック試行例外 [${model}]`, {
          model: model,
          usedSlot: keyInfo.slot,
          usedKey: keyInfo.masked,
          error: e.message
        });
      }
    }

    if (generatedB64) {
      const transparentDataUrl = await makeBackgroundTransparent(generatedB64);
      
      if (targetLayer === 'brand') {
        state.layers.brand.aiGraphicDataUrl = transparentDataUrl;
        updateLayerBadge('brandLayerBadge', true, 'AI文字生成済', '標準フォント描画中');
      } else if (targetLayer === 'kanji') {
        state.layers.kanji.aiGraphicDataUrl = transparentDataUrl;
        updateLayerBadge('kanjiLayerBadge', true, 'AI毛筆生成済', '標準筆文字描画中');
      } else if (targetLayer === 'romaji') {
        state.layers.romaji.aiGraphicDataUrl = transparentDataUrl;
        updateLayerBadge('romajiLayerBadge', true, 'AI欧文生成済', '標準欧文描画中');
      }

      await reloadAllLayerImages();
      await saveState(true);
      renderCard();
      showLoading(false);
      Logger.success(`🎉 「${text}」の100%完全透過文字グラフィックが完成しました！`);
      alert(`🎉 「${text}」のAI文字グラフィックを生成しました！\n（※薄い背景は完全に消去され、100%透明になっています）`);
    } else {
      showLoading(false);
      Logger.error('AI文字生成失敗', lastError);
      alert(`AI文字生成エラー:\n${lastError}\n\n※未生成時は美しい標準フォントで自動プレビューされます。`);
    }
  }

  // 🌟 超高精度 4隅サンプリング ＆ ユークリッド色差・輝度クロマキー完全透明化
  function makeBackgroundTransparent(imgDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width;
        offCanvas.height = img.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(img, 0, 0);

        const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        const data = imgData.data;

        const corners = [
          [0, 0],
          [img.width - 1, 0],
          [0, img.height - 1],
          [img.width - 1, img.height - 1]
        ];
        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach(([cx, cy]) => {
          const idx = (cy * img.width + cx) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR /= 4;
        bgG /= 4;
        bgB /= 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

          if (dist < 45 || brightness < 38) {
            data[i + 3] = 0;
          } else if (dist < 75 || brightness < 68) {
            const factor = Math.max((dist - 45) / 30, (brightness - 38) / 30);
            data[i + 3] = Math.round(data[i + 3] * factor);
          }
        }

        offCtx.putImageData(imgData, 0, 0);
        resolve(offCanvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(imgDataUrl);
      img.src = imgDataUrl;
    });
  }

  // --- 🖼️ 背景グラフィック生成 ---
  async function generateAiBackground() {
    const keyInfo = getEffectiveApiKeyInfo('image');
    const apiKey = keyInfo.key;
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('APIキーが設定されていません。右レール「⚙️ 設定」の「🔑 APIキーを登録・変更」からAPIキーを入力してください。');
      return;
    }

    const prompt = (aiPromptInput && aiPromptInput.value.trim()) ? aiPromptInput.value.trim() : (state.aiPrompt || '').trim();
    state.aiPrompt = prompt;
    if (!prompt) {
      alert('プロンプトを作成してください。');
      return;
    }

    showLoading(true, '✨ Gemini が背景グラフィックを生成中...');
    Logger.api('背景生成開始', {
      prompt: prompt,
      usedSlot: keyInfo.slot,
      usedKey: keyInfo.masked,
      slot1_freeKey: keyInfo.slot1_masked,
      slot2_paidKey: keyInfo.slot2_masked,
      activeMode: keyInfo.activeMode
    });

    const candidateModels = [
      'gemini-3.1-flash-image',
      'gemini-3-pro-image',
      'nano-banana-pro-preview',
      'gemini-2.5-flash-image'
    ];

    let generatedImageUrl = null;
    let lastError = '';

    for (const model of candidateModels) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const payload = {
          contents: [{
            parts: [{ text: `Generate a high resolution card background graphic image: ${prompt}. Clean layout for overlaying text, no typography.` }]
          }]
        };

        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          const data = await resp.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              generatedImageUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
              break;
            }
          }
          if (generatedImageUrl) break;
        } else {
          const errJson = await resp.json().catch(() => ({}));
          lastError = errJson.error ? errJson.error.message : `HTTP ${resp.status}`;
          Logger.warn(`背景生成モデル試行失敗 [${model}]: HTTP ${resp.status}`, {
            model: model,
            status: resp.status,
            usedSlot: keyInfo.slot,
            usedKey: keyInfo.masked,
            error: lastError
          });
        }
      } catch (e) {
        lastError = e.message;
        Logger.warn(`背景生成モデル試行例外 [${model}]`, {
          model: model,
          usedSlot: keyInfo.slot,
          usedKey: keyInfo.masked,
          error: e.message
        });
      }
    }

    if (generatedImageUrl) {
      state.layers.bg.src = generatedImageUrl;
      await loadBgImage(generatedImageUrl);
      await saveState(true);
      renderCard();
      showLoading(false);
      Logger.success('🎉 背景画像の生成が完了しました！');
      alert('🎉 背景画像を生成しました！');
      switchTab('tab-editor', 'tab-ai-letters');
    } else {
      showLoading(false);
      Logger.error('背景生成失敗', lastError);
      alert(`背景生成エラー:\n${lastError}`);
    }
  }

  function compressImageBase64(dataUrl, maxDim = 1000, quality = 0.75, mimeType = null) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      return Promise.resolve(dataUrl);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round(h * (maxDim / w));
            w = maxDim;
          } else {
            w = Math.round(w * (maxDim / h));
            h = maxDim;
          }
        }
        const oc = document.createElement('canvas');
        oc.width = w;
        oc.height = h;
        const ctx = oc.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        
        const targetMime = mimeType || (dataUrl.includes('image/png') ? 'image/png' : 'image/jpeg');
        const out = oc.toDataURL(targetMime, quality);
        resolve(out);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // --- 🎴 非破壊マルチレイヤー アーカイブシステム（IndexedDB大容量保護＆軽量化） ---
  async function saveCurrentToArchive() {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 200;
    thumbCanvas.height = Math.round(200 * (state.canvasHeight / state.canvasWidth));
    const tCtx = thumbCanvas.getContext('2d');
    tCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumbData = thumbCanvas.toDataURL('image/jpeg', 0.60);

    // 🌟 レイヤー画像のインテリジェント圧縮（通信サイズ激減）
    const savedLayers = JSON.parse(JSON.stringify(state.layers));
    if (savedLayers.bg && savedLayers.bg.src && savedLayers.bg.src.startsWith('data:')) {
      savedLayers.bg.src = await compressImageBase64(savedLayers.bg.src, 1200, 0.75, 'image/jpeg');
    }
    if (savedLayers.brand && savedLayers.brand.aiGraphicDataUrl) {
      savedLayers.brand.aiGraphicDataUrl = await compressImageBase64(savedLayers.brand.aiGraphicDataUrl, 800, 1.0, 'image/png');
    }
    if (savedLayers.kanji && savedLayers.kanji.aiGraphicDataUrl) {
      savedLayers.kanji.aiGraphicDataUrl = await compressImageBase64(savedLayers.kanji.aiGraphicDataUrl, 800, 1.0, 'image/png');
    }
    if (savedLayers.romaji && savedLayers.romaji.aiGraphicDataUrl) {
      savedLayers.romaji.aiGraphicDataUrl = await compressImageBase64(savedLayers.romaji.aiGraphicDataUrl, 800, 1.0, 'image/png');
    }

    const archiveItem = {
      id: 'card_' + Date.now(),
      createdAt: new Date().toLocaleDateString('ja-JP'),
      title: `${state.layers.brand.text || 'CARD'} - ${state.layers.kanji.text || ''} (${state.layers.specs.serial.text || 'No-Serial'})`,
      ownerName: state.layers.specs.owner.text,
      sizeText: state.layers.specs.size.text,
      thumbnail: thumbData,
      stateData: {
        aspectRatio: state.aspectRatio,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        layers: savedLayers
      }
    };

    state.deletedCardIds.delete(archiveItem.id);
    state.cardArchive.unshift(archiveItem);
    await saveState(true);
    renderArchiveGrid();
    Logger.success(`[ARCHIVE_SAVE] 非破壊レイヤー保存完了: ${archiveItem.title}`);
    alert(`「${archiveItem.title}」をカード履歴アルバムに非破壊保存しました！\n（※IndexedDB大容量データベースに安全保持され、リロードしても絶対に消えません）`);
  }

  function renderArchiveGrid() {
    if (!archiveGrid) return;
    const activeCards = state.cardArchive.filter(c => !state.deletedCardIds.has(c.id));
    if (archiveCountTag) archiveCountTag.textContent = `${activeCards.length} 件`;

    if (activeCards.length === 0) {
      archiveGrid.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:11px;">
          保存されたカード履歴はまだありません。<br>
          「アルバムに保存」を押すと完全非破壊レイヤーで蓄積されます。
        </div>
      `;
      return;
    }

    archiveGrid.innerHTML = activeCards.map((item) => `
      <div class="archive-card-item">
        <img src="${item.thumbnail}" class="archive-thumb" alt="thumb">
        <div class="archive-title">${Logger.escapeHtml(item.title)}</div>
        <div class="archive-meta">
          ${Logger.escapeHtml(item.ownerName || '未指定')} | ${Logger.escapeHtml(item.sizeText || '')}<br>
          ${item.createdAt}
        </div>
        <div class="archive-actions">
          <button type="button" class="btn-primary btn-sm" data-action="restore" data-id="${item.id}">復元・編集</button>
          <button type="button" class="btn-secondary btn-sm" data-action="delete" data-id="${item.id}" style="color:#ef5350;">削除</button>
        </div>
      </div>
    `).join('');

    archiveGrid.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const target = state.cardArchive.find(c => c.id === id);
        if (!target) return;

        if (action === 'restore') {
          restoreFromArchive(target);
        } else if (action === 'delete') {
          deleteCard(id);
        }
      });
    });
  }

  async function deleteCard(cardId) {
    const target = state.cardArchive.find(c => c.id === cardId);
    if (!target) return;
    if (confirm(`「${target.title}」を削除しますか？\n（※他の全端末からも安全に消去されます）`)) {
      state.deletedCardIds.add(cardId);
      state.cardArchive = state.cardArchive.filter(c => c.id !== cardId);
      await saveState(true);
      renderArchiveGrid();
      Logger.success(`[ARCHIVE_DELETE] カード履歴を削除しました (墓石登録・即時送信): ${target.title}`);
    }
  }

  async function restoreFromArchive(item) {
    if (item.stateData) {
      state.aspectRatio = item.stateData.aspectRatio || state.aspectRatio;
      state.canvasWidth = item.stateData.canvasWidth || 1500;
      state.canvasHeight = item.stateData.canvasHeight || 2100;
      if (item.stateData.layers) {
        state.layers = item.stateData.layers;
      }
    }
    syncInputsFromState();
    await reloadAllLayerImages();
    await saveState(false);
    renderCard();
    switchTab('tab-editor', 'tab-ai-letters');
    Logger.success(`[ARCHIVE_RESTORE] 「${item.title}」を完全非破壊復元しました。`);
    alert(`「${item.title}」を非破壊復元しました！\n文字が重なることなく、背景・AI文字・スペックを個別に自由に再編集できます。`);
  }

  // --- 手動背景ドロップゾーン ---
  function setupDropZone() {
    const dropZone = document.getElementById('bgDropZone');
    const fileInput = document.getElementById('bgFileInput');
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', (e) => {
      if (e.target === fileInput) return;
      fileInput.value = '';
      Logger.info('🖱️ [UI_CLICK] 手動背景枠をクリック ➔ ファイル選択ダイアログを開きます');
      fileInput.click();
    });

    fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        Logger.warn('[FILE_SELECT] 手動背景: ファイルが選択されませんでした（キャンセル）');
        return;
      }
      Logger.info(`📁 [FILE_SELECT] 手動背景: 画像ファイル選択検知: ${file.name}`, {
        sizeBytes: file.size,
        sizeKB: Math.round(file.size / 1024),
        mimeType: file.type || 'unknown'
      });
      handleImageFile(file);
      fileInput.value = '';
    });

    ['dragenter', 'dragover'].forEach(n => {
      dropZone.addEventListener(n, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });
    ['dragleave'].forEach(n => {
      dropZone.addEventListener(n, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');

      let file = null;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        file = e.dataTransfer.files[0];
      } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];
        if (item.kind === 'file') file = item.getAsFile();
      }

      if (file) {
        Logger.info(`📥 [FILE_DROP] 手動背景: 画像ファイルドロップ検知: ${file.name}`, {
          sizeBytes: file.size,
          sizeKB: Math.round(file.size / 1024),
          mimeType: file.type || 'unknown'
        });
        handleImageFile(file);
      } else {
        Logger.warn('[FILE_DROP] 手動背景: 有効な画像ファイルが見つかりませんでした');
      }
    });
  }

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      state.layers.bg.src = e.target.result;
      await loadBgImage(e.target.result);
      await saveState(true);
      renderCard();
      Logger.success(`手動背景画像を適用しました (${file.name})`);
    };
    reader.readAsDataURL(file);
  }

  // --- 画像リロード管理 ---
  function reloadAllLayerImages() {
    return Promise.all([
      loadBgImage(state.layers.bg.src),
      loadLayerImage('brand', state.layers.brand.aiGraphicDataUrl),
      loadLayerImage('kanji', state.layers.kanji.aiGraphicDataUrl),
      loadLayerImage('romaji', state.layers.romaji.aiGraphicDataUrl)
    ]);
  }

  function loadBgImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { loadedBgImg = img; resolve(); };
      img.onerror = () => { loadedBgImg = null; resolve(); };
      img.src = src || 'assets/bg_default.jpg';
    });
  }

  function loadLayerImage(type, dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl) {
        if (type === 'brand') loadedBrandImg = null;
        if (type === 'kanji') loadedKanjiImg = null;
        if (type === 'romaji') loadedRomajiImg = null;
        resolve();
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (type === 'brand') loadedBrandImg = img;
        if (type === 'kanji') loadedKanjiImg = img;
        if (type === 'romaji') loadedRomajiImg = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl;
    });
  }

  // 📐 印刷限界測定用ミリ・パーセント精密キャリブレーションスケール透かしオーバーレイ描画 (v4.15.0)
  function drawCalibrationOverlay(targetCtx, w, h) {
    targetCtx.save();

    // 1. 半透明ダークベール（背面のクワガタ・文字が透けて見える設計）
    targetCtx.fillStyle = 'rgba(11, 13, 20, 0.45)';
    targetCtx.fillRect(0, 0, w, h);

    // 2. 精密グリッド線 (50px微細線, 250px主線)
    targetCtx.lineWidth = 1;
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = 0; x < w; x += 50) {
      targetCtx.beginPath();
      targetCtx.moveTo(x, 0);
      targetCtx.lineTo(x, h);
      targetCtx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      targetCtx.beginPath();
      targetCtx.moveTo(0, y);
      targetCtx.lineTo(w, y);
      targetCtx.stroke();
    }

    targetCtx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    for (let x = 0; x < w; x += 250) {
      targetCtx.beginPath();
      targetCtx.moveTo(x, 0);
      targetCtx.lineTo(x, h);
      targetCtx.stroke();
    }
    for (let y = 0; y < h; y += 250) {
      targetCtx.beginPath();
      targetCtx.moveTo(0, y);
      targetCtx.lineTo(w, y);
      targetCtx.stroke();
    }

    // 3. パーセント別ボーダー目盛り線 (100%〜90%)
    const scales = [
      { pct: 100, color: '#ff3b30', lw: 8, dash: [], label: '100% (用紙外周端・余白0%)' },
      { pct: 99,  color: '#ff9500', lw: 2.5, dash: [8, 4], label: '99% (-1%余白)' },
      { pct: 98,  color: '#ffcc00', lw: 2.5, dash: [8, 4], label: '98% (-2%余白)' },
      { pct: 97,  color: '#ffd54f', lw: 4, dash: [], label: '97% (-3%余白 ★標準フチなし印刷推奨)' },
      { pct: 96,  color: '#34c759', lw: 2.5, dash: [8, 4], label: '96% (-4%余白)' },
      { pct: 95,  color: '#00e5ff', lw: 3, dash: [10, 5], label: '95% (-5%余白 ★広域カット機種)' },
      { pct: 92,  color: '#5856d6', lw: 2, dash: [6, 6], label: '92% (-8%余白)' },
      { pct: 90,  color: '#af52de', lw: 3, dash: [], label: '90% (-10%余白 コアセーフゾーン)' }
    ];

    scales.forEach(s => {
      const marginX = w * ((100 - s.pct) / 200);
      const marginY = h * ((100 - s.pct) / 200);
      const rectW = w - marginX * 2;
      const rectH = h - marginY * 2;

      targetCtx.save();
      targetCtx.strokeStyle = s.color;
      targetCtx.lineWidth = s.lw;
      targetCtx.setLineDash(s.dash);
      targetCtx.strokeRect(marginX, marginY, rectW, rectH);

      // 目盛りラベル
      targetCtx.setLineDash([]);
      targetCtx.fillStyle = s.color;
      targetCtx.font = 'bold 18px monospace, sans-serif';
      targetCtx.textAlign = 'left';
      targetCtx.textBaseline = 'top';

      if (s.pct >= 95) {
        targetCtx.fillText(s.label, marginX + 12, marginY + 8);
      }
      targetCtx.restore();
    });

    // 4. 外周ルーラー目盛り (10px, 50px, 100px)
    targetCtx.save();
    targetCtx.strokeStyle = '#ffffff';
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    targetCtx.font = '13px monospace, sans-serif';

    // 上下ルーラー
    for (let x = 0; x <= w; x += 10) {
      const is100 = (x % 100 === 0);
      const is50 = (x % 50 === 0);
      const tickH = is100 ? 30 : (is50 ? 18 : 8);
      targetCtx.lineWidth = is100 ? 2 : 1;

      targetCtx.beginPath();
      targetCtx.moveTo(x, 0);
      targetCtx.lineTo(x, tickH);
      targetCtx.stroke();

      targetCtx.beginPath();
      targetCtx.moveTo(x, h);
      targetCtx.lineTo(x, h - tickH);
      targetCtx.stroke();

      if (is100 && x > 0 && x < w) {
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'top';
        targetCtx.fillText(`${x}`, x, tickH + 4);
        targetCtx.textBaseline = 'bottom';
        targetCtx.fillText(`${x}`, x, h - tickH - 4);
      }
    }

    // 左右ルーラー
    for (let y = 0; y <= h; y += 10) {
      const is100 = (y % 100 === 0);
      const is50 = (y % 50 === 0);
      const tickW = is100 ? 30 : (is50 ? 18 : 8);
      targetCtx.lineWidth = is100 ? 2 : 1;

      targetCtx.beginPath();
      targetCtx.moveTo(0, y);
      targetCtx.lineTo(tickW, y);
      targetCtx.stroke();

      targetCtx.beginPath();
      targetCtx.moveTo(w, y);
      targetCtx.lineTo(w - tickW, y);
      targetCtx.stroke();

      if (is100 && y > 0 && y < h) {
        targetCtx.textAlign = 'left';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText(`${y}`, tickW + 6, y);
        targetCtx.textAlign = 'right';
        targetCtx.fillText(`${y}`, w - tickW - 6, y);
      }
    }
    targetCtx.restore();

    // 5. 四隅の斜め45度アライメント＆コーナーレジスタ
    const cornerSize = 180;
    const corners = [
      { x: 0, y: 0, dx: 1, dy: 1, label: 'TOP-LEFT (左上)' },
      { x: w, y: 0, dx: -1, dy: 1, label: 'TOP-RIGHT (右上)' },
      { x: 0, y: h, dx: 1, dy: -1, label: 'BOTTOM-LEFT (左下)' },
      { x: w, y: h, dx: -1, dy: -1, label: 'BOTTOM-RIGHT (右下)' }
    ];

    corners.forEach(cn => {
      targetCtx.save();
      targetCtx.strokeStyle = '#00e5ff';
      targetCtx.lineWidth = 3;
      targetCtx.beginPath();
      targetCtx.moveTo(cn.x, cn.y);
      targetCtx.lineTo(cn.x + cn.dx * cornerSize, cn.y + cn.dy * cornerSize);
      targetCtx.stroke();

      targetCtx.fillStyle = '#00e5ff';
      targetCtx.font = 'bold 16px sans-serif';
      targetCtx.textAlign = cn.dx === 1 ? 'left' : 'right';
      targetCtx.textBaseline = cn.dy === 1 ? 'top' : 'bottom';
      targetCtx.fillText(cn.label, cn.x + cn.dx * 35, cn.y + cn.dy * 35);
      targetCtx.restore();
    });

    // 6. 中央クロスヘア＆同心円ターゲット
    const cx = w / 2;
    const cy = h / 2;

    targetCtx.save();
    targetCtx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    targetCtx.lineWidth = 2;
    [100, 250, 450].forEach(r => {
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, r, 0, Math.PI * 2);
      targetCtx.stroke();
    });

    targetCtx.beginPath();
    targetCtx.moveTo(cx - 200, cy);
    targetCtx.lineTo(cx + 200, cy);
    targetCtx.moveTo(cx, cy - 200);
    targetCtx.lineTo(cx, cy + 200);
    targetCtx.stroke();
    targetCtx.restore();

    // 7. 中央の半透明解説パネル（透かし対応・高さコンパクト化）
    const panelW = 1000;
    const panelH = 460;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    targetCtx.save();
    targetCtx.fillStyle = 'rgba(11, 13, 20, 0.85)';
    targetCtx.fillRect(panelX, panelY, panelW, panelH);
    targetCtx.strokeStyle = '#ffd54f';
    targetCtx.lineWidth = 3;
    targetCtx.strokeRect(panelX, panelY, panelW, panelH);
    targetCtx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    targetCtx.lineWidth = 1;
    targetCtx.strokeRect(panelX + 6, panelY + 6, panelW - 12, panelH - 12);

    targetCtx.fillStyle = '#ffd54f';
    targetCtx.font = 'bold 30px "Cinzel", serif, sans-serif';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'top';
    targetCtx.fillText('KUWAGATA PRINT CALIBRATION SCALE', cx, panelY + 24);

    targetCtx.fillStyle = '#ffffff';
    targetCtx.font = 'bold 20px sans-serif';
    targetCtx.fillText('📐 印刷限界測定スケール（透かしオーバーレイ）', cx, panelY + 68);

    targetCtx.fillStyle = '#00e5ff';
    targetCtx.font = '16px monospace, sans-serif';
    targetCtx.fillText(`解像度: ${w} × ${h} px (比率 5:7 / 標準トレカ 63×88mm)`, cx, panelY + 102);

    targetCtx.textAlign = 'left';
    targetCtx.fillStyle = '#eaeaea';
    targetCtx.font = '18px sans-serif';
    const startY = panelY + 144;
    const lh = 36;

    const instructions = [
      '【印刷限界測定＆完璧な位置調整の手順】',
      '① 「完成カードを高解像度PNG保存」から印刷し、フチなし印刷の用紙外周を確認します。',
      '② 印刷された用紙端を見て「何%の目盛り線まで写っているか」を確認します（例: 97%＝3%余白必要）。',
      '③ 画面上の「安全枠ガイド」の数字を確認したパーセント（例: 3%）に合わせます。',
      '④ 「🧲 枠内に収める」を押せば、すべての文字が安全枠の内側に一瞬で自動収容されます！',
      '⑤ 確認が終わったら、上部の「📐 スケール表示中」を押すと元のカード表示に戻ります。'
    ];

    instructions.forEach((line, idx) => {
      if (idx === 0) {
        targetCtx.fillStyle = '#ffd54f';
        targetCtx.font = 'bold 19px sans-serif';
      } else if (line.includes('例:')) {
        targetCtx.fillStyle = '#ffcc00';
        targetCtx.font = 'bold 17.5px sans-serif';
      } else if (line.includes('🧲')) {
        targetCtx.fillStyle = '#00e5ff';
        targetCtx.font = 'bold 18px sans-serif';
      } else {
        targetCtx.fillStyle = '#d5d7de';
        targetCtx.font = '17.5px sans-serif';
      }
      targetCtx.fillText(line, panelX + 32, startY + (idx * lh));
    });

    targetCtx.restore();
    targetCtx.restore();
  }

  // 🖨️ 印刷安全枠（セーフティゾーン）ガイド線オーバーレイ描画 (v4.15.0 高コントラスト版)
  function drawSafetyGuideLayer(targetCtx, w, h) {
    const marginPct = (state.safetyMargin !== undefined ? state.safetyMargin : 3);
    const mx = w * (marginPct / 100);
    const my = h * (marginPct / 100);
    const safeW = w - (mx * 2);
    const safeH = h - (my * 2);

    targetCtx.save();

    // 1. 切欠け危険領域（マージン外側）の鮮明な赤色シェーディング
    if (marginPct > 0) {
      targetCtx.fillStyle = 'rgba(255, 45, 85, 0.28)';
      targetCtx.fillRect(0, 0, w, my);
      targetCtx.fillRect(0, h - my, w, my);
      targetCtx.fillRect(0, my, mx, h - (my * 2));
      targetCtx.fillRect(w - mx, my, mx, h - (my * 2));

      // 危険領域のハザード境界線
      targetCtx.strokeStyle = 'rgba(255, 45, 85, 0.85)';
      targetCtx.lineWidth = 2;
      targetCtx.strokeRect(0, 0, w, h);

      // 危険ゾーン警告ラベル
      targetCtx.fillStyle = '#ffffff';
      targetCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      targetCtx.shadowBlur = 8;
      targetCtx.font = 'bold 17px sans-serif';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      if (my >= 22) {
        targetCtx.fillText(`⚠️ CUTOFF RISK ZONE (余白切り欠き危険領域: 外周 ${marginPct}%)`, w / 2, my / 2);
        targetCtx.fillText(`⚠️ CUTOFF RISK ZONE (余白切り欠き危険領域: 外周 ${marginPct}%)`, w / 2, h - my / 2);
      }
      targetCtx.shadowBlur = 0;
    }

    // 2. セーフティゾーン枠線（高輝度イエローゴールド太破線 + シャドウ）
    targetCtx.save();
    targetCtx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    targetCtx.shadowBlur = 12;
    targetCtx.strokeStyle = '#ffe600';
    targetCtx.lineWidth = 5;
    targetCtx.setLineDash([20, 10]);
    targetCtx.strokeRect(mx, my, safeW, safeH);
    targetCtx.restore();

    // 3. 四隅の強調L字ブラケット（シアン色発光）
    const bracketLen = Math.min(55, Math.max(28, w * 0.04));
    targetCtx.save();
    targetCtx.strokeStyle = '#00f0ff';
    targetCtx.lineWidth = 7;
    targetCtx.lineCap = 'square';
    targetCtx.shadowColor = 'rgba(0, 240, 255, 0.9)';
    targetCtx.shadowBlur = 10;

    // Top-Left
    targetCtx.beginPath();
    targetCtx.moveTo(mx, my + bracketLen);
    targetCtx.lineTo(mx, my);
    targetCtx.lineTo(mx + bracketLen, my);
    targetCtx.stroke();

    // Top-Right
    targetCtx.beginPath();
    targetCtx.moveTo(mx + safeW - bracketLen, my);
    targetCtx.lineTo(mx + safeW);
    targetCtx.lineTo(mx + safeW, my + bracketLen);
    targetCtx.stroke();

    // Bottom-Left
    targetCtx.beginPath();
    targetCtx.moveTo(mx, my + safeH - bracketLen);
    targetCtx.lineTo(mx, my + safeH);
    targetCtx.lineTo(mx + bracketLen, my + safeH);
    targetCtx.stroke();

    // Bottom-Right
    targetCtx.beginPath();
    targetCtx.moveTo(mx + safeW - bracketLen, my + safeH);
    targetCtx.lineTo(mx + safeW, my + safeH);
    targetCtx.lineTo(mx + safeW, my + safeH - bracketLen);
    targetCtx.stroke();
    targetCtx.restore();

    // 4. セーフティゾーン上部中央バッジ
    const badgeText = `🖨️ PRINT SAFE ZONE (安全枠: ${marginPct}%)`;
    targetCtx.font = 'bold 18px monospace, sans-serif';
    const textWidth = targetCtx.measureText(badgeText).width;
    const badgeW = textWidth + 40;
    const badgeH = 36;
    const badgeX = (w - badgeW) / 2;
    const badgeY = Math.max(my + 12, 18);

    targetCtx.save();
    targetCtx.fillStyle = 'rgba(11, 13, 20, 0.92)';
    targetCtx.beginPath();
    if (typeof targetCtx.roundRect === 'function') {
      targetCtx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    } else {
      targetCtx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    targetCtx.fill();

    targetCtx.strokeStyle = '#ffe600';
    targetCtx.lineWidth = 2.5;
    targetCtx.stroke();

    targetCtx.fillStyle = '#ffe600';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText(badgeText, w / 2, badgeY + badgeH / 2);
    targetCtx.restore();

    targetCtx.restore();
  }

  // 🧲 すべての文字・スペックを現在の安全枠内に自動収容 (v4.15.0)
  function clampLayersToSafeZone() {
    const marginPct = (state.safetyMargin !== undefined ? state.safetyMargin : 3);
    const minY = marginPct + 4;
    const maxY = 100 - marginPct - 4;
    const maxPixelX = Math.round((state.canvasWidth / 2) - (state.canvasWidth * (marginPct / 100)) - 100);

    let changedCount = 0;

    // 1. ブランド
    if (state.layers.brand) {
      if (state.layers.brand.y < minY || state.layers.brand.y > maxY) {
        state.layers.brand.y = Math.max(minY, Math.min(maxY, state.layers.brand.y));
        changedCount++;
      }
      if (Math.abs(state.layers.brand.x || 0) > maxPixelX) {
        state.layers.brand.x = Math.max(-maxPixelX, Math.min(maxPixelX, state.layers.brand.x || 0));
        changedCount++;
      }
    }

    // 2. 漢字
    if (state.layers.kanji) {
      if (state.layers.kanji.y < minY || state.layers.kanji.y > maxY) {
        state.layers.kanji.y = Math.max(minY, Math.min(maxY, state.layers.kanji.y));
        changedCount++;
      }
      if (Math.abs(state.layers.kanji.x || 0) > maxPixelX) {
        state.layers.kanji.x = Math.max(-maxPixelX, Math.min(maxPixelX, state.layers.kanji.x || 0));
        changedCount++;
      }
    }

    // 3. ローマ字
    if (state.layers.romaji) {
      if (state.layers.romaji.y < minY || state.layers.romaji.y > maxY) {
        state.layers.romaji.y = Math.max(minY, Math.min(maxY, state.layers.romaji.y));
        changedCount++;
      }
      if (Math.abs(state.layers.romaji.x || 0) > maxPixelX) {
        state.layers.romaji.x = Math.max(-maxPixelX, Math.min(maxPixelX, state.layers.romaji.x || 0));
        changedCount++;
      }
    }

    // 4. スペック
    if (state.layers.specs) {
      ['owner', 'serial', 'size', 'extra'].forEach(key => {
        const item = state.layers.specs[key];
        if (item) {
          if (item.y < minY || item.y > maxY) {
            item.y = Math.max(minY, Math.min(maxY, item.y));
            changedCount++;
          }
          if (Math.abs(item.x || 0) > maxPixelX) {
            item.x = Math.max(-maxPixelX, Math.min(maxPixelX, item.x || 0));
            changedCount++;
          }
        }
      });
    }

    // 安全枠ガイドを自動ON
    state.showSafetyGuide = true;
    const toggle = document.getElementById('toggleSafetyGuide');
    if (toggle) toggle.checked = true;

    syncInputsFromState();
    saveState(false);
    renderCard();

    Logger.success(`[SAFE_ZONE_CLAMP] 🧲 全レイヤーを安全枠（マージン${marginPct}% / Y:${minY}%〜${maxY}%）内に収めました (補正箇所: ${changedCount})`);
  }

  // --- 🌟 非破壊マルチレイヤー描画エンジン ---
  function renderCard() {
    if (isRendering) return;
    isRendering = true;
    const t0 = performance.now();

    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackgroundLayer(ctx, canvas.width, canvas.height);
    drawBrandLayer(ctx, canvas.width, canvas.height);
    drawKanjiLayer(ctx, canvas.width, canvas.height);
    drawRomajiLayer(ctx, canvas.width, canvas.height);
    drawSpecsLayer(ctx, canvas.width, canvas.height);

    // 📐 印刷限界測定スケール・オーバーレイ描画 (v4.15.0)
    if (state.showCalibrationOverlay) {
      drawCalibrationOverlay(ctx, canvas.width, canvas.height);
    }

    // 🖨️ 印刷安全枠ガイドオーバーレイ描画 (v4.15.0)
    if (state.showSafetyGuide) {
      drawSafetyGuideLayer(ctx, canvas.width, canvas.height);
    }

    const renderTime = (performance.now() - t0).toFixed(1);
    Logger.render(`[RENDER_DONE] レイヤー合成完了 (${renderTime}ms, ${canvas.width}x${canvas.height}px)`);

    // 🎴 フローティング確認シートが開いていればリアルタイム同期 (v4.19.0)
    const floatingDrawer = document.getElementById('floatingPreviewDrawer');
    if (floatingDrawer && !floatingDrawer.classList.contains('hidden')) {
      syncFloatingCanvas();
    }

    isRendering = false;
  }

  function drawBackgroundLayer(targetCtx, w, h) {
    targetCtx.save();
    if (loadedBgImg) {
      const img = loadedBgImg;
      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;

      let drawW, drawH, drawX, drawY;
      if (imgRatio > canvasRatio) {
        drawH = h;
        drawW = h * imgRatio;
        drawX = (w - drawW) / 2;
        drawY = 0;
      } else {
        drawW = w;
        drawH = w / imgRatio;
        drawX = 0;
        drawY = (h - drawH) / 2;
      }
      targetCtx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      const grad = targetCtx.createRadialGradient(w/2, h/2, w*0.1, w/2, h/2, Math.max(w, h)*0.7);
      grad.addColorStop(0, '#1c1f26');
      grad.addColorStop(1, '#050608');
      targetCtx.fillStyle = grad;
      targetCtx.fillRect(0, 0, w, h);
    }
    targetCtx.restore();
  }

  function drawBrandLayer(targetCtx, w, h) {
    const layer = state.layers.brand;
    if (!layer.text) return;

    targetCtx.save();
    targetCtx.globalAlpha = (layer.opacity || 100) / 100;
    const centerX = (w / 2) + (layer.x || 0);
    const centerY = (h * (layer.y / 100));

    if (loadedBrandImg) {
      const scale = (layer.scale || 100) / 100;
      const drawW = w * 0.7 * scale;
      const drawH = drawW * (loadedBrandImg.height / loadedBrandImg.width);
      targetCtx.drawImage(loadedBrandImg, centerX - (drawW / 2), centerY - (drawH / 2), drawW, drawH);
    } else {
      const fontSize = Math.round(w * 0.088 * ((layer.scale || 100) / 100));
      const fontFace = "'Cinzel', serif";
      const color = layer.color || 'gold';
      const shadow = !!layer.shadow;
      const glow = !!layer.glow;
      const glowBlur = layer.glowBlur !== undefined ? Number(layer.glowBlur) : 14;

      if (layer.redInitial && layer.text.length > 1) {
        targetCtx.font = `800 ${fontSize}px ${fontFace}`;
        const initial = layer.text.charAt(0);
        const rest = layer.text.slice(1);
        const initialWidth = targetCtx.measureText(initial).width;
        const restWidth = targetCtx.measureText(rest).width;
        const totalWidth = initialWidth + restWidth;
        const startX = centerX - (totalWidth / 2);
        const initialX = startX + (initialWidth / 2);
        const restX = startX + initialWidth + (restWidth / 2);

        // 🌫️ 白い霧・光彩の縁取り（全体）
        if (glow) {
          targetCtx.save();
          targetCtx.font = `800 ${fontSize}px ${fontFace}`;
          targetCtx.textAlign = 'center';
          targetCtx.textBaseline = 'middle';
          targetCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
          targetCtx.shadowBlur = glowBlur;
          targetCtx.shadowOffsetX = 0;
          targetCtx.shadowOffsetY = 0;
          targetCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          targetCtx.fillText(layer.text, centerX, centerY);
          targetCtx.fillText(layer.text, centerX, centerY);
          targetCtx.restore();
        }

        // 先頭文字（深紅ルビー）
        targetCtx.save();
        if (shadow) {
          targetCtx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          targetCtx.shadowBlur = Math.max(4, fontSize * 0.1);
          targetCtx.shadowOffsetX = Math.max(2, fontSize * 0.025);
          targetCtx.shadowOffsetY = Math.max(2, fontSize * 0.025);
        }
        drawRubyInitial(targetCtx, initial, initialX, centerY, fontSize);
        targetCtx.restore();

        // 残りの文字
        if (color === 'gold') {
          drawGoldText(targetCtx, rest, restX, centerY, fontSize, fontFace, shadow);
        } else {
          targetCtx.save();
          targetCtx.font = `800 ${fontSize}px ${fontFace}`;
          targetCtx.textAlign = 'center';
          targetCtx.textBaseline = 'middle';
          if (shadow) {
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            targetCtx.shadowBlur = Math.max(4, fontSize * 0.1);
            targetCtx.shadowOffsetX = Math.max(2, fontSize * 0.025);
            targetCtx.shadowOffsetY = Math.max(2, fontSize * 0.025);
          }
          targetCtx.fillStyle = color;
          targetCtx.fillText(rest, restX, centerY);
          targetCtx.restore();
        }
      } else {
        drawSpecTextItem(targetCtx, layer.text, centerX, centerY, fontSize, fontFace, '800', color, '0px', {
          glow,
          shadow,
          glowBlur
        });
      }
    }
    targetCtx.restore();
  }

  function drawKanjiLayer(targetCtx, w, h) {
    const layer = state.layers.kanji;
    if (!layer.text) return;

    targetCtx.save();
    targetCtx.globalAlpha = (layer.opacity || 100) / 100;
    const centerX = (w / 2) + (layer.x || 0);
    const centerY = (h * (layer.y / 100));

    if (loadedKanjiImg) {
      const scale = (layer.scale || 100) / 100;
      const drawW = w * 0.6 * scale;
      const drawH = drawW * (loadedKanjiImg.height / loadedKanjiImg.width);
      targetCtx.drawImage(loadedKanjiImg, centerX - (drawW / 2), centerY - (drawH / 2), drawW, drawH);
    } else {
      const fontSize = Math.round(w * 0.28 * ((layer.scale || 100) / 100));
      const fontFace = layer.font || "'Hiragino Mincho ProN', serif";
      const color = layer.color || '#111111';
      const shadow = !!layer.shadow;
      const glow = !!layer.glow;
      const glowBlur = layer.glowBlur !== undefined ? Number(layer.glowBlur) : 14;

      drawSpecTextItem(targetCtx, layer.text, centerX, centerY, fontSize, fontFace, '800', color, '0px', {
        glow,
        shadow,
        glowBlur
      });
    }
    targetCtx.restore();
  }

  function drawRomajiLayer(targetCtx, w, h) {
    const layer = state.layers.romaji;
    if (!layer.text) return;

    targetCtx.save();
    targetCtx.globalAlpha = (layer.opacity || 100) / 100;
    const centerX = (w / 2) + (layer.x || 0);
    const centerY = (h * (layer.y / 100));

    if (loadedRomajiImg) {
      const scale = (layer.scale || 100) / 100;
      const drawW = w * 0.6 * scale;
      const drawH = drawW * (loadedRomajiImg.height / loadedRomajiImg.width);
      targetCtx.drawImage(loadedRomajiImg, centerX - (drawW / 2), centerY - (drawH / 2), drawW, drawH);
    } else {
      const fontSize = Math.round(w * 0.10 * ((layer.scale || 100) / 100));
      const fontFace = layer.font || "'Cinzel', serif";
      const color = layer.color || 'gold';
      const shadow = !!layer.shadow;
      const glow = !!layer.glow;
      const glowBlur = layer.glowBlur !== undefined ? Number(layer.glowBlur) : 14;

      drawSpecTextItem(targetCtx, layer.text, centerX, centerY, fontSize, fontFace, '800', color, '0px', {
        glow,
        shadow,
        glowBlur
      });
    }
    targetCtx.restore();
  }

  function drawSpecTextItem(targetCtx, text, x, y, size, fontFace, fontWeight, color, letterSpacing = '0px', options = {}) {
    if (!text || String(text).trim() === '') return;
    const isGlow = !!options.glow;
    const isShadow = !!options.shadow;
    const glowBlur = options.glowBlur !== undefined ? Number(options.glowBlur) : 14;

    // 1. 🌫️ 白い霧・光彩の縁取り（ホワイトグロー）描画
    if (isGlow) {
      targetCtx.save();
      targetCtx.font = `${fontWeight || '700'} ${size}px ${fontFace || "'Cinzel', serif"}`;
      if (letterSpacing && letterSpacing !== '0px') {
        targetCtx.letterSpacing = letterSpacing;
      }
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';

      // 霧のように広がるソフトホワイト光彩
      targetCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
      targetCtx.shadowBlur = glowBlur;
      targetCtx.shadowOffsetX = 0;
      targetCtx.shadowOffsetY = 0;

      // 下層に半透明白で2回描画して霧の密度を高める
      targetCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      targetCtx.fillText(text, x, y);
      targetCtx.fillText(text, x, y);
      targetCtx.restore();
    }

    // 2. 👑 24K純金文字の描画
    if (color === 'gold') {
      drawGoldText(targetCtx, text, x, y, size, fontFace, isShadow);
      return;
    }

    // 3. 通常テキスト（シャドウ付き・なし）描画
    targetCtx.save();
    targetCtx.font = `${fontWeight || '700'} ${size}px ${fontFace || "'Cinzel', serif"}`;
    if (letterSpacing && letterSpacing !== '0px') {
      targetCtx.letterSpacing = letterSpacing;
    }
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    if (isShadow) {
      targetCtx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      targetCtx.shadowBlur = Math.max(4, size * 0.1);
      targetCtx.shadowOffsetX = Math.max(2, size * 0.025);
      targetCtx.shadowOffsetY = Math.max(3, size * 0.04);
    } else {
      const colLower = (color || '').toLowerCase();
      const isLight = colLower === '#ffffff' || colLower === '#fff' || colLower === 'white' || colLower === '#f8f8f8';
      if (isLight && !isGlow) {
        targetCtx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        targetCtx.shadowBlur = Math.max(3, size * 0.08);
        targetCtx.shadowOffsetX = 1;
        targetCtx.shadowOffsetY = 2;
      } else {
        targetCtx.shadowColor = 'transparent';
        targetCtx.shadowBlur = 0;
        targetCtx.shadowOffsetX = 0;
        targetCtx.shadowOffsetY = 0;
      }
    }

    targetCtx.fillStyle = color || '#111111';
    targetCtx.fillText(text, x, y);
    targetCtx.restore();
  }

  function drawSpecsLayer(targetCtx, w, h) {
    const specs = state.layers.specs;
    targetCtx.save();

    // 1. オーナーラベル (独立描画)
    const ownerLabelData = specs.ownerLabel || { text: specs.owner?.label, font: "'Cinzel', serif", size: 36, y: (specs.owner?.y ? specs.owner.y - 4 : 74), x: 0, color: '#222222', shadow: false, glow: false, glowBlur: 14 };
    const olText = ownerLabelData.text !== undefined ? ownerLabelData.text : (specs.owner?.label || '');
    if (olText && olText.trim() !== '') {
      const olY = h * ((ownerLabelData.y !== undefined ? ownerLabelData.y : 74) / 100);
      const olX = (w / 2) + (ownerLabelData.x || 0);
      const olSize = ownerLabelData.size || 36;
      const olFont = ownerLabelData.font || "'Cinzel', serif";
      const olColor = ownerLabelData.color || '#222222';
      const olOptions = { shadow: ownerLabelData.shadow, glow: ownerLabelData.glow, glowBlur: ownerLabelData.glowBlur };
      drawSpecTextItem(targetCtx, olText, olX, olY, olSize, olFont, '600', olColor, '0px', olOptions);
    }

    // 2. オーナー名 / ブリーダー名 (独立描画)
    if (specs.owner && specs.owner.text && specs.owner.text.trim() !== '') {
      const oY = h * (specs.owner.y / 100);
      const oX = (w / 2) + (specs.owner.x || 0);
      const oColor = specs.owner.color || '#111111';
      const oOptions = { shadow: specs.owner.shadow, glow: specs.owner.glow, glowBlur: specs.owner.glowBlur };
      drawSpecTextItem(targetCtx, specs.owner.text, oX, oY, specs.owner.size, specs.owner.font, '700', oColor, '0px', oOptions);
    }

    // 3. 個体識別番号 / シリアル (独立描画)
    if (specs.serial && specs.serial.text) {
      const sY = h * (specs.serial.y / 100);
      const sX = (w / 2) + (specs.serial.x || 0);
      const sColor = specs.serial.color || '#2a2a2a';
      const sOptions = { shadow: specs.serial.shadow, glow: specs.serial.glow, glowBlur: specs.serial.glowBlur };
      drawSpecTextItem(targetCtx, specs.serial.text, sX, sY, specs.serial.size, specs.serial.font, '700', sColor, '1px', sOptions);
    }

    // 4. サイズ (独立描画)
    if (specs.size && specs.size.text) {
      const zY = h * (specs.size.y / 100);
      const zX = (w / 2) + (specs.size.x || 0);
      const zColor = specs.size.color || '#111111';
      const zOptions = { shadow: specs.size.shadow, glow: specs.size.glow, glowBlur: specs.size.glowBlur };
      drawSpecTextItem(targetCtx, specs.size.text, zX, zY, specs.size.size, specs.size.font, '800', zColor, '0px', zOptions);
    }

    // 5. 追加証明情報 (独立描画)
    if (specs.extra && specs.extra.text) {
      const eY = h * (specs.extra.y / 100);
      const eX = (w / 2) + (specs.extra.x || 0);
      const eColor = specs.extra.color || '#444444';
      const eOptions = { shadow: specs.extra.shadow, glow: specs.extra.glow, glowBlur: specs.extra.glowBlur };
      drawSpecTextItem(targetCtx, specs.extra.text, eX, eY, specs.extra.size, specs.extra.font, '600', eColor, '0px', eOptions);
    }

    targetCtx.restore();
  }

  function drawGoldText(targetCtx, text, x, y, size, fontFace, extraShadow = false) {
    targetCtx.save();
    targetCtx.font = `800 ${size}px ${fontFace || "'Cinzel', serif"}`;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    const shadowBlur = extraShadow ? Math.max(8, size * 0.18) : Math.max(4, size * 0.1);
    const shadowAlpha = extraShadow ? 0.85 : 0.45;
    targetCtx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
    targetCtx.shadowBlur = shadowBlur;
    targetCtx.shadowOffsetX = Math.max(2, size * 0.02);
    targetCtx.shadowOffsetY = Math.max(3, size * 0.04);

    const grad = targetCtx.createLinearGradient(0, y - size/2, 0, y + size/2);
    grad.addColorStop(0, '#fff4cc');
    grad.addColorStop(0.2, '#f5d57a');
    grad.addColorStop(0.5, '#c9983e');
    grad.addColorStop(0.8, '#8e631d');
    grad.addColorStop(1, '#53380b');

    targetCtx.fillStyle = grad;
    targetCtx.fillText(text, x, y);

    targetCtx.strokeStyle = 'rgba(255, 255, 240, 0.4)';
    targetCtx.lineWidth = Math.max(1, size * 0.015);
    targetCtx.strokeText(text, x, y);

    targetCtx.restore();
  }

  function drawRubyInitial(targetCtx, char, x, y, size) {
    targetCtx.save();
    targetCtx.font = `800 ${size}px 'Cinzel', serif`;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    const rubyGrad = targetCtx.createLinearGradient(0, y - size/2, 0, y + size/2);
    rubyGrad.addColorStop(0, '#be2528');
    rubyGrad.addColorStop(0.5, '#841315');
    rubyGrad.addColorStop(1, '#4a080a');

    targetCtx.fillStyle = rubyGrad;
    targetCtx.fillText(char, x, y);
    targetCtx.restore();
  }

  function drawKanjiCharacter(targetCtx, char, x, y, size, fontFace) {
    targetCtx.save();
    targetCtx.font = `700 ${size}px ${fontFace || "'Hiragino Mincho ProN', serif"}`;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    const sumiGrad = targetCtx.createLinearGradient(0, y - size/2, 0, y + size/2);
    sumiGrad.addColorStop(0, '#2b2a28');
    sumiGrad.addColorStop(0.5, '#111111');
    sumiGrad.addColorStop(1, '#1e1c18');

    targetCtx.fillStyle = sumiGrad;
    targetCtx.fillText(char, x, y);
    targetCtx.restore();
  }

  // 🌟 万能画像エクスポート ＆ iPhone/iPad写真保存・PC両対応モーダル (v4.9.0)
  function exportLayer(type) {
    showLoading(true, '高画質PNG生成中...');
    setTimeout(async () => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = state.canvasWidth;
        offCanvas.height = state.canvasHeight;
        const offCtx = offCanvas.getContext('2d');

        let filename = `kuwagata_card_${Date.now()}.png`;

        if (type === 'merged') {
          drawBackgroundLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawBrandLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawKanjiLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawRomajiLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawSpecsLayer(offCtx, state.canvasWidth, state.canvasHeight);
          if (state.exportWithGuide) {
            if (state.showCalibrationOverlay) {
              drawCalibrationOverlay(offCtx, state.canvasWidth, state.canvasHeight);
            }
            if (state.showSafetyGuide) {
              drawSafetyGuideLayer(offCtx, state.canvasWidth, state.canvasHeight);
            }
          }
          filename = `kuwagata_card_${state.layers.kanji.text || 'cert'}_full.png`;
        } else if (type === 'bg') {
          drawBackgroundLayer(offCtx, state.canvasWidth, state.canvasHeight);
          filename = `kuwagata_bg_clean.png`;
        } else if (type === 'text') {
          drawBrandLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawKanjiLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawRomajiLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawSpecsLayer(offCtx, state.canvasWidth, state.canvasHeight);
          filename = `kuwagata_text_layers_transparent.png`;
        }

        const dataUrl = offCanvas.toDataURL('image/png');

        // Blob & File オブジェクトの生成（iOS Web Share & 写真保存用）
        let exportFile = null;
        await new Promise((resolve) => {
          offCanvas.toBlob((blob) => {
            if (blob) {
              exportFile = new File([blob], filename, { type: 'image/png' });
            }
            resolve();
          }, 'image/png');
        });

        const isIOS = isIOSDevice();

        // 📱 PCや非iOS環境のみ、従来の自動ファイルダウンロードを実行（iOSは「ファイルに保存」の混乱防止のためスキップ）
        if (!isIOS) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        openImageSaveModal(dataUrl, filename, exportFile);
        Logger.success(`[EXPORT_SUCCESS] 高解像度PNG生成完了: ${filename}`, {
          isIOS: isIOS,
          resolution: `${state.canvasWidth}x${state.canvasHeight}`,
          sizeKB: exportFile ? Math.round(exportFile.size / 1024) : 0,
          savedVia: isIOS ? '写真保存モーダル待機(iOS)' : '自動ダウンロード+モーダル'
        });
      } catch (err) {
        Logger.error('[EXPORT_ERROR] PNG出力例外', err.message);
        alert('PNG出力エラー: ' + err.message);
      } finally {
        showLoading(false);
      }
    }, 50);
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function showLoading(show, text) {
    if (show) {
      loadingText.textContent = text || '処理中...';
      loadingOverlay.classList.remove('hidden');
    } else {
      loadingOverlay.classList.add('hidden');
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
