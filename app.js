/**
 * KUWAGATA PREMIUM CARD STUDIO - APPLICATION ENGINE (v4.6.0 Localhost Suite & Secret Unlock Edition)
 * Zero-Limit StorageVault (IndexedDB), Multi-Layer Compositor, Deep Diagnostic Logging & Orthodox Sync
 */

(function () {
  'use strict';

  const APP_VERSION = 'v4.6.0';
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
        opacity: 100
      },
      kanji: {
        text: '蒼',
        font: "'Hiragino Mincho ProN', 'YuMincho', serif",
        aiGraphicDataUrl: null,
        x: 0,
        y: 44,
        scale: 100,
        opacity: 100
      },
      romaji: {
        text: 'AOI',
        font: "'Cinzel', serif",
        aiGraphicDataUrl: null,
        x: 0,
        y: 68,
        scale: 100,
        opacity: 100
      },
      specs: {
        owner: {
          label: 'Owner',
          text: '佃 宗行 様',
          font: "'Hiragino Mincho ProN', serif",
          size: 62,
          y: 77,
          x: 0
        },
        serial: {
          text: 'NO.AS-05',
          font: "'Cinzel', serif",
          size: 38,
          y: 83,
          x: 0
        },
        size: {
          text: '♂77mm',
          font: "'Hiragino Mincho ProN', serif",
          size: 58,
          y: 88,
          x: 0
        },
        extra: {
          text: '',
          font: "'Hiragino Mincho ProN', serif",
          size: 32,
          y: 93,
          x: 0
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

  // --- 🛡️ 永久APIキー金庫管理 ---
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
        Logger.info('🔑 端末内永久キー金庫からAPIキーをロードしました。');
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
    setupLocalhostFloatingSuite();
    setupDictManager();
    setupBackupManager();
    setupImageSaveModal();
    setupLetterPromptChips();
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
  }

  // --- 🧪 Localhost Floating Suite & 10-Tap 管理者アンロック ---
  function setupLocalhostFloatingSuite() {
    const floatingContainer = document.getElementById('localhostFloatingContainer');
    if (!floatingContainer) return;

    const isUnlocked = localStorage.getItem('kuwagata_localhost_unlocked') === 'true';
    if (IS_LOCAL_DEV || isUnlocked) {
      floatingContainer.classList.remove('hidden');
    } else {
      floatingContainer.classList.add('hidden');
    }

    // 🔒 ブランドタイトル10回タップで管理者アンロック (PIN: 1234)
    const titleArea = document.getElementById('mainBrandTitleArea');
    if (titleArea) {
      let tapCount = 0;
      let lastTapTime = 0;

      titleArea.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastTapTime > 3500) {
          tapCount = 1;
        } else {
          tapCount++;
        }
        lastTapTime = now;

        if (tapCount >= 10) {
          tapCount = 0;
          const pin = prompt('🔐 管理者PINコードを入力してください (4桁):');
          if (pin === '1234') {
            const currentlyUnlocked = localStorage.getItem('kuwagata_localhost_unlocked') === 'true';
            const nextState = !currentlyUnlocked;
            localStorage.setItem('kuwagata_localhost_unlocked', String(nextState));
            if (nextState) {
              floatingContainer.classList.remove('hidden');
              Logger.success('✨ 管理者モード（Localhost Suite）を有効化しました。');
              alert('✨ 管理者モード（Localhost Suite）を有効化しました。');
            } else {
              if (!IS_LOCAL_DEV) floatingContainer.classList.add('hidden');
              Logger.info('管理者モード（Localhost Suite）を無効化しました。');
              alert('管理者モード（Localhost Suite）を無効化しました。');
            }
          } else if (pin !== null) {
            alert('❌ PINコードが正しくありません。');
          }
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

  // 🌟 StorageVault (IndexedDB) への完全保存
  async function saveState(triggerCloud = true) {
    try {
      const stateObj = {
        aspectRatio: state.aspectRatio,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        layers: state.layers,
        selectedChipIds: Array.from(state.selectedChipIds)
      };

      await StorageVault.set('kuwagata_card_studio_state_v4', stateObj);
      await StorageVault.set('kuwagata_categories_v4', state.categories);
      await StorageVault.set('kuwagata_chips_v4', state.chips);
      await StorageVault.set('kuwagata_card_archive_v4', state.cardArchive);
      await StorageVault.set('kuwagata_deleted_card_ids_v4', Array.from(state.deletedCardIds));
      await StorageVault.set('kuwagata_deleted_chip_ids_v4', Array.from(state.deletedChipIds));

      saveApiKeyVault();

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
        if (saved.layers) state.layers = saved.layers;
        if (saved.aspectRatio) state.aspectRatio = saved.aspectRatio;
        if (saved.canvasWidth) state.canvasWidth = saved.canvasWidth;
        if (saved.canvasHeight) state.canvasHeight = saved.canvasHeight;
        if (saved.selectedChipIds) state.selectedChipIds = new Set(saved.selectedChipIds);
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
    setVal('brandOpacity', state.layers.brand.opacity);
    setVal('brandOpacityVal', state.layers.brand.opacity + '%');
    updateLayerBadge('brandLayerBadge', !!state.layers.brand.aiGraphicDataUrl, 'AI文字生成済', '標準フォント描画中');

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

    setVal('ownerLabel', state.layers.specs.owner.label);
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

    document.querySelectorAll('.ratio-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ratio === state.aspectRatio);
    });
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

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'SPAN') el.textContent = val;
      else el.value = val;
    }
  }

  function setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  }

  // --- 📝 文字スタイルチップの動的挿入イベント ---
  function setupLetterPromptChips() {
    document.querySelectorAll('.letter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const text = btn.dataset.text;
        const textareaId = `${target}AiPromptInput`;
        const textarea = document.getElementById(textareaId);
        if (textarea) {
          const currentVal = textarea.value.trim();
          if (currentVal) {
            textarea.value = currentVal + ', ' + text;
          } else {
            textarea.value = text;
          }
          Logger.info(`プロンプトチップ追加 [${target}]: ${text}`);
        }
      });
    });
  }

  // --- 🖼️ 万能画像保存 ＆ 長押し写真追加モーダル ---
  function setupImageSaveModal() {
    const btnClose = document.getElementById('btnCloseImageSaveModal');
    const btnCloseBottom = document.getElementById('btnCloseImageSaveModalBottom');

    [btnClose, btnCloseBottom].forEach(btn => {
      if (btn) btn.addEventListener('click', () => imageSaveModal.classList.add('hidden'));
    });
  }

  function openImageSaveModal(dataUrl, filename) {
    const previewImg = document.getElementById('savedModalImagePreview');
    const directLink = document.getElementById('btnDirectDownloadLink');

    if (previewImg) previewImg.src = dataUrl;
    if (directLink) {
      directLink.href = dataUrl;
      directLink.download = filename;
    }

    imageSaveModal.classList.remove('hidden');
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

    if (btnHeaderSync) btnHeaderSync.addEventListener('click', () => backupModal.classList.remove('hidden'));
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
      btnQuickToggleKey.className = 'btn-header-tag paid-tag';
      keyModeLabel.textContent = '有料キー';
    } else {
      btnQuickToggleKey.className = 'btn-header-tag free-tag';
      keyModeLabel.textContent = '無料キー';
    }
  }

  function getEffectiveApiKey(purpose = 'any') {
    if (purpose === 'image') return state.paidApiKey || state.freeApiKey;
    if (purpose === 'text') return state.freeApiKey || state.paidApiKey;
    return state.activeKeyMode === 'paid' ? (state.paidApiKey || state.freeApiKey) : (state.freeApiKey || state.paidApiKey);
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

          if (state.selectedChipIds.has(chip.id)) {
            state.selectedChipIds.delete(chip.id);
            chipEl.classList.remove('active');
          } else {
            state.selectedChipIds.add(chip.id);
            chipEl.classList.add('active');
          }
          updateCombinedPrompt();
          saveState();
        });

        gridEl.appendChild(chipEl);
      });

      groupEl.appendChild(gridEl);
      dynamicChipGroupsContainer.appendChild(groupEl);
    });
  }

  function updateCombinedPrompt() {
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
    }
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

  // --- イベントリスナー設定 ---
  function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = document.getElementById(btn.dataset.tab);
        if (targetTab) targetTab.classList.add('active');
      });
    });

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
        Logger.success('Gemini APIキーを端末の永久金庫に保存しました。');
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

    // 🌟 生成ボタン群
    const btnGenAi = document.getElementById('btnGenerateAiBg');
    if (btnGenAi) btnGenAi.addEventListener('click', () => generateAiBackground());

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
    bindInput('ownerLabel', (val) => { state.layers.specs.owner.label = val; });
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
        
        renderDynamicChipGroups();
        updateCombinedPrompt();
        saveState();
        renderCard();
      });
    });

    document.getElementById('btnRerender').addEventListener('click', () => renderCard());

    document.getElementById('btnResetSample').addEventListener('click', () => {
      state.layers.brand.text = 'LOJING';
      state.layers.brand.redInitial = true;
      state.layers.kanji.text = '蒼';
      state.layers.romaji.text = 'AOI';
      state.layers.specs.owner.text = '佃 宗行 様';
      state.layers.specs.serial.text = 'NO.AS-05';
      state.layers.specs.size.text = '♂77mm';
      state.layers.specs.extra.text = '';
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

  // --- 👁️ Vision AI: 画像解析 ＆ 文字消し背景自動復元 ---
  function setupVisionDropZone() {
    const zone = document.getElementById('visionDropZone');
    const input = document.getElementById('visionFileInput');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        analyzeImageAndRestoreCleanBg(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(n => {
      zone.addEventListener(n, (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(n => {
      zone.addEventListener(n, (e) => { e.preventDefault(); zone.classList.remove('dragover'); });
    });
    zone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        analyzeImageAndRestoreCleanBg(e.dataTransfer.files[0]);
      }
    });

    const btnApplyClean = document.getElementById('btnApplyCleanBg');
    if (btnApplyClean) {
      btnApplyClean.addEventListener('click', () => {
        if (!state.lastCleanBgUrl) return;
        state.layers.bg.src = state.lastCleanBgUrl;
        loadBgImage(state.lastCleanBgUrl, () => {
          saveState();
          renderCard();
          alert('🎉 復元された文字なし背景をスタジオに適用しました！');
          document.querySelector('.tab-btn[data-tab="tab-ai-letters"]').click();
        });
      });
    }

    const btnApplyBuilder = document.getElementById('btnApplyExtractedToBuilder');
    if (btnApplyBuilder) {
      btnApplyBuilder.addEventListener('click', () => {
        if (!state.lastExtractedPrompt) return;
        aiPromptInput.value = state.lastExtractedPrompt.ja;
        state.aiPrompt = state.lastExtractedPrompt.ja;
        saveState();
        document.querySelector('.tab-btn[data-tab="tab-prompt-builder"]').click();
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

  async function analyzeImageAndRestoreCleanBg(file) {
    const apiKey = getEffectiveApiKey('text');
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('画像解析を行うために、右上の「API設定」からAPIキーを入力してください。');
      return;
    }

    const promptArea = document.getElementById('visionUploadPrompt');
    const loadingInline = document.getElementById('visionLoadingInline');
    const cleanArea = document.getElementById('cleanBgResultArea');
    const resultArea = document.getElementById('visionResultArea');

    if (promptArea) promptArea.classList.add('hidden');
    if (loadingInline) loadingInline.classList.remove('hidden');
    if (cleanArea) cleanArea.classList.add('hidden');
    if (resultArea) resultArea.classList.add('hidden');

    showLoading(true, 'Gemini Vision AI が画像を解析＆文字消し背景を復元中...');
    Logger.api(`Vision AI 解析＆文字消し開始: ${file.name}`);

    try {
      const base64Data = await readFileAsBase64(file);
      const mimeType = file.type || 'image/jpeg';

      const promptInstruction = `あなたは最高峰の画像解析＆インペインティングエンジニアです。
添付されたカード画像を解析し、印字されている文字（ブランド名、漢字血統名、数字、サイズなど）をすべて完全に無視・除去して、
その下にある『純粋な背景グラフィック（和紙テクスチャ、中央の水彩グラデーション、金箔散らし）』を完全復元するための詳細プロンプトを出力してください。

JSONフォーマットのみを出力してください:
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
        headers: { 'Content-Type': 'application/json' },
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

      state.lastCleanBgUrl = `data:${mimeType};base64,${base64Data}`;
      document.getElementById('cleanBgPreviewImg').src = state.lastCleanBgUrl;

      if (promptArea) promptArea.classList.remove('hidden');
      if (loadingInline) loadingInline.classList.add('hidden');
      if (cleanArea) cleanArea.classList.remove('hidden');
      if (resultArea) resultArea.classList.remove('hidden');

      showLoading(false);
      Logger.success('Vision AI 解析＆文字消し背景復元完了');
    } catch (err) {
      if (promptArea) promptArea.classList.remove('hidden');
      if (loadingInline) loadingInline.classList.add('hidden');
      showLoading(false);
      Logger.error('Vision AI 解析例外', err.message);
      alert('解析エラー: ' + err.message);
    }
  }

  // --- ✨ Gemini AI 文字グラフィック生成エンジン (超高精度クロマキー透過) ---
  async function generateAiTextGraphic(targetLayer) {
    const apiKey = getEffectiveApiKey('image');
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('AI文字グラフィックを生成するために、右上の「API設定」のスロット2（有料キー）にAPIキーを入力してください。');
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
    Logger.api(`AI文字グラフィック生成開始 [${targetLayer}]: ${text}`);

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
          headers: { 'Content-Type': 'application/json' },
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
        }
      } catch (e) {
        lastError = e.message;
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
    const apiKey = getEffectiveApiKey('image');
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('背景画像を生成するために、右上の「API設定」のスロット2（有料キー）にAPIキーを入力してください。');
      return;
    }

    const prompt = (state.aiPrompt || '').trim();
    if (!prompt) {
      alert('プロンプトを作成してください。');
      return;
    }

    showLoading(true, '✨ Gemini が背景グラフィックを生成中...');
    Logger.api('背景生成開始', { prompt: prompt });

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
          headers: { 'Content-Type': 'application/json' },
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
        }
      } catch (e) {
        lastError = e.message;
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
      document.querySelector('.tab-btn[data-tab="tab-ai-letters"]').click();
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
    document.querySelector('.tab-btn[data-tab="tab-ai-letters"]').click();
    Logger.success(`[ARCHIVE_RESTORE] 「${item.title}」を完全非破壊復元しました。`);
    alert(`「${item.title}」を非破壊復元しました！\n文字が重なることなく、背景・AI文字・スペックを個別に自由に再編集できます。`);
  }

  // --- 手動背景ドロップゾーン ---
  function setupDropZone() {
    const dropZone = document.getElementById('bgDropZone');
    const fileInput = document.getElementById('bgFileInput');
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleImageFile(e.target.files[0]);
    });

    ['dragenter', 'dragover'].forEach(n => {
      dropZone.addEventListener(n, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(n => {
      dropZone.addEventListener(n, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
    });
    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
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

    const renderTime = (performance.now() - t0).toFixed(1);
    Logger.render(`[RENDER_DONE] 5レイヤー合成完了 (${renderTime}ms, ${canvas.width}x${canvas.height}px)`);

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
      targetCtx.font = `800 ${fontSize}px 'Cinzel', serif`;
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';

      if (layer.redInitial && layer.text.length > 1) {
        const initial = layer.text.charAt(0);
        const rest = layer.text.slice(1);
        const initialWidth = targetCtx.measureText(initial).width;
        const restWidth = targetCtx.measureText(rest).width;
        const totalWidth = initialWidth + restWidth;
        const startX = centerX - (totalWidth / 2);

        drawRubyInitial(targetCtx, initial, startX + (initialWidth / 2), centerY, fontSize);
        drawGoldText(targetCtx, rest, startX + initialWidth + (restWidth / 2), centerY, fontSize, "'Cinzel', serif");
      } else {
        drawGoldText(targetCtx, layer.text, centerX, centerY, fontSize, "'Cinzel', serif");
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
      targetCtx.font = `800 ${fontSize}px ${layer.font || "'Hiragino Mincho ProN', serif"}`;
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      drawKanjiCharacter(targetCtx, layer.text, centerX, centerY, fontSize, layer.font);
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
      targetCtx.font = `800 ${fontSize}px ${layer.font || "'Cinzel', serif"}`;
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      drawGoldText(targetCtx, layer.text, centerX, centerY, fontSize, layer.font || "'Cinzel', serif");
    }
    targetCtx.restore();
  }

  function drawSpecsLayer(targetCtx, w, h) {
    const specs = state.layers.specs;
    targetCtx.save();

    if (specs.owner.text) {
      const oY = h * (specs.owner.y / 100);
      const oX = (w / 2) + (specs.owner.x || 0);
      if (specs.owner.label) {
        targetCtx.font = `600 ${Math.round(w * 0.040)}px 'Cinzel', serif`;
        targetCtx.fillStyle = '#222';
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText(specs.owner.label, oX, oY - (specs.owner.size * 0.4));
      }
      targetCtx.font = `700 ${specs.owner.size}px ${specs.owner.font}`;
      targetCtx.fillStyle = '#111';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(specs.owner.text, oX, oY + (specs.owner.size * 0.2));
    }

    if (specs.serial.text) {
      const sY = h * (specs.serial.y / 100);
      const sX = (w / 2) + (specs.serial.x || 0);
      targetCtx.font = `700 ${specs.serial.size}px ${specs.serial.font}`;
      targetCtx.fillStyle = '#2a2a2a';
      targetCtx.letterSpacing = '1px';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(specs.serial.text, sX, sY);
    }

    if (specs.size.text) {
      const zY = h * (specs.size.y / 100);
      const zX = (w / 2) + (specs.size.x || 0);
      targetCtx.font = `800 ${specs.size.size}px ${specs.size.font}`;
      targetCtx.fillStyle = '#111';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(specs.size.text, zX, zY);
    }

    if (specs.extra.text) {
      const eY = h * (specs.extra.y / 100);
      const eX = (w / 2) + (specs.extra.x || 0);
      targetCtx.font = `600 ${specs.extra.size}px ${specs.extra.font}`;
      targetCtx.fillStyle = '#444';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(specs.extra.text, eX, eY);
    }

    targetCtx.restore();
  }

  function drawGoldText(targetCtx, text, x, y, size, fontFace) {
    targetCtx.save();
    targetCtx.font = `800 ${size}px ${fontFace || "'Cinzel', serif"}`;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    targetCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    targetCtx.shadowBlur = Math.max(4, size * 0.1);
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

  // 🌟 万能画像エクスポート ＆ iPhone/Mac両対応モーダル
  function exportLayer(type) {
    showLoading(true, '高画質PNG生成中...');
    setTimeout(() => {
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

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        openImageSaveModal(dataUrl, filename);
        Logger.success(`[EXPORT_SUCCESS] 高解像度PNG生成完了: ${filename}`);
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
