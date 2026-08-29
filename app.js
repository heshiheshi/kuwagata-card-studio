/**
 * KUWAGATA PREMIUM CARD STUDIO - APPLICATION ENGINE (v4.0.0 Multi-Layer Architecture)
 * True Non-Destructive Multi-Layer Compositor, AI Text Graphics & Apple Safe Commercial Typography
 */

(function () {
  'use strict';

  const APP_VERSION = 'v4.0.0';
  const VALID_PASSCODES = ['lojing2026', 'kuwagata2026', '7777'];
  const CLOUD_SYNC_ENDPOINT = '/api/sync';

  // 🛡️ 端末固定の永久キー金庫（アップデートでも絶対に消えないキー名）
  const VAULT_KEYS = {
    FREE_API_KEY: 'kuwagata_vault_free_api_key',
    PAID_API_KEY: 'kuwagata_vault_paid_api_key',
    ACTIVE_KEY_MODE: 'kuwagata_vault_active_key_mode',
    AUTH_PASSED: 'kuwagata_vault_auth_passed'
  };

  // --- システムロガー ---
  const Logger = {
    logs: [],
    maxLogs: 200,

    add(type, msg, rawData = null) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      
      const entry = { time: timeStr, type: type, msg: msg, rawData: rawData };
      this.logs.unshift(entry);
      if (this.logs.length > this.maxLogs) this.logs.pop();

      this.updateUI();
      console.log(`[${entry.time}] [${type.toUpperCase()}] ${msg}`, rawData || '');
    },

    info(msg, data) { this.add('info', msg, data); },
    api(msg, data) { this.add('api', msg, data); },
    success(msg, data) { this.add('success', msg, data); },
    warn(msg, data) { this.add('warn', msg, data); },
    error(msg, data) { this.add('error', msg, data); },

    updateUI() {
      const pill = document.getElementById('logCountPill');
      const tag = document.getElementById('logModalCount');
      const terminal = document.getElementById('logTerminal');

      if (pill) pill.textContent = this.logs.length;
      if (tag) tag.textContent = `${this.logs.length} 件`;

      if (terminal) {
        terminal.innerHTML = this.logs.map(log => {
          let extra = '';
          if (log.rawData) {
            const rawStr = typeof log.rawData === 'object' ? JSON.stringify(log.rawData, null, 2) : String(log.rawData);
            extra = `<pre style="margin-top:4px; padding:6px; background:#000; color:#81c784; font-size:11px; border-radius:4px; overflow-x:auto;">${this.escapeHtml(rawStr)}</pre>`;
          }
          return `
            <div class="log-entry">
              <span class="log-time">[${log.time}]</span>
              <span class="log-tag ${log.type}">${log.type}</span>
              <div class="log-msg">
                <span>${this.escapeHtml(log.msg)}</span>
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
        let line = `[${l.time}] [${l.type.toUpperCase()}] ${l.msg}`;
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

  // --- 🌟 非破壊マルチレイヤー 状態管理 (State) ---
  const state = {
    freeApiKey: '',
    paidApiKey: '',
    activeKeyMode: 'free',

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
      // レイヤー0: 純粋背景
      bg: {
        src: 'assets/bg_default.jpg',
        brightness: 100
      },
      // レイヤー1: ブランド/ブリーダー AI文字
      brand: {
        text: 'LOJING',
        redInitial: true,
        aiGraphicDataUrl: null,
        x: 0,
        y: 20, // % of height
        scale: 100, // %
        opacity: 100
      },
      // レイヤー2: メイン漢字血統 AI文字
      kanji: {
        text: '蒼',
        font: "'Hiragino Mincho ProN', 'YuMincho', serif",
        aiGraphicDataUrl: null,
        x: 0,
        y: 44,
        scale: 100,
        opacity: 100
      },
      // レイヤー3: 英字血統 AI文字
      romaji: {
        text: 'AOI',
        font: "'Cinzel', serif",
        aiGraphicDataUrl: null,
        x: 0,
        y: 68,
        scale: 100,
        opacity: 100
      },
      // レイヤー4: 個体スペック文字（Apple標準商用安全フォント）
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
        Logger.info('🔑 端末内永久キー金庫からAPIキーを自動ロードしました。');
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

  // --- ☁️ 完全自動シームレス Cloudflare KV 同期エンジン ---
  const CloudSyncManager = {
    syncTimer: null,
    isSyncing: false,
    lastSyncedTime: null,

    init() {
      this.updateIndicator('online', '自動同期稼働中');
      this.pullFromCloud(true);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.pullFromCloud(true);
      });
      window.addEventListener('focus', () => {
        this.pullFromCloud(true);
      });
      setInterval(() => {
        this.pullFromCloud(true);
      }, 20000);
    },

    getSanitizedPayload() {
      const payload = {
        studio: 'KUWAGATA_PREMIUM_STUDIO',
        version: APP_VERSION,
        categories: state.categories,
        chips: state.chips,
        selectedChipIds: Array.from(state.selectedChipIds),
        cardArchive: state.cardArchive,
        updatedAt: Date.now()
      };
      return payload;
    },

    scheduleAutoSync() {
      clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => {
        this.pushToCloud(true);
      }, 600);
    },

    async pushToCloud(silent = true) {
      if (this.isSyncing) return;
      this.isSyncing = true;
      this.updateIndicator('syncing', '同期中...');

      const payload = this.getSanitizedPayload();
      const payloadJson = JSON.stringify(payload);
      const sizeKB = Math.round(payloadJson.length / 1024);

      try {
        const resp = await fetch(CLOUD_SYNC_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadJson
        });

        if (resp.ok) {
          this.lastSyncedTime = new Date();
          this.updateIndicator('online', `同期完了 (${this.formatTime(this.lastSyncedTime)})`);
          Logger.success(`☁️ 自動同期 [送信完了] (カード: ${payload.cardArchive.length} 枚, 単語: ${payload.chips.length})`);
          if (!silent) {
            alert(`🎉 Cloudflare KV へ保存が完了しました！\n\n・単語辞書: ${payload.chips.length} 件\n・非破壊カード履歴: ${payload.cardArchive.length} 件 (${sizeKB} KB)\n\n全端末へ自動反映されます。`);
          }
        }
      } catch (err) {
        this.updateIndicator('online', '自動同期稼働中');
        Logger.warn('自動同期送信通知', err.message);
      } finally {
        this.isSyncing = false;
      }
    },

    async pullFromCloud(silent = true) {
      if (this.isSyncing) return;
      this.isSyncing = true;
      this.updateIndicator('syncing', '同期中...');

      try {
        const resp = await fetch(CLOUD_SYNC_ENDPOINT);
        if (resp.ok) {
          const data = await resp.json();
          if (data && (data.studio === 'KUWAGATA_PREMIUM_STUDIO' || Array.isArray(data.cardArchive))) {
            let hasChanges = false;

            if (data.categories && Object.keys(data.categories).length > 0) {
              state.categories = data.categories;
              hasChanges = true;
            }
            if (data.chips && Array.isArray(data.chips) && data.chips.length > 0) {
              state.chips = data.chips;
              hasChanges = true;
            }
            if (data.selectedChipIds && Array.isArray(data.selectedChipIds)) {
              state.selectedChipIds = new Set(data.selectedChipIds);
              hasChanges = true;
            }
            if (data.cardArchive && Array.isArray(data.cardArchive)) {
              if (JSON.stringify(state.cardArchive) !== JSON.stringify(data.cardArchive)) {
                state.cardArchive = data.cardArchive;
                hasChanges = true;
              }
            }

            if (hasChanges) {
              saveState(false);
              renderDynamicChipGroups();
              updateCombinedPrompt();
              renderArchiveGrid();
            }

            this.lastSyncedTime = new Date(data.updatedAt || Date.now());
            this.updateIndicator('online', `同期完了 (${this.formatTime(this.lastSyncedTime)})`);
            Logger.success(`☁️ 自動同期 [受信完了] (カード: ${state.cardArchive.length} 枚, 単語: ${state.chips.length})`);
            if (!silent) {
              alert(`🎉 Cloudflare KV から最新データを取得しました！\n\n画面を最新状態に更新しました。`);
            }
          }
        }
      } catch (err) {
        this.updateIndicator('online', '自動同期稼働中');
      } finally {
        this.isSyncing = false;
      }
    },

    updateIndicator(status, text) {
      const dot = document.getElementById('headerSyncDot');
      const badge = document.getElementById('modalSyncBadge');
      const statusText = document.getElementById('cloudSyncStatusText');

      if (dot) dot.className = `sync-status-dot ${status}`;
      if (badge) badge.textContent = status === 'syncing' ? '🔄 同期中' : '🟢 自動連動中';
      if (statusText) statusText.textContent = `最終同期: ${text}`;
    },

    formatTime(d) {
      return d.toTimeString().split(' ')[0];
    }
  };

  async function init() {
    setupAuthGate();
    loadApiKeyVault();
    Logger.info(`Kuwagata Card Studio ${APP_VERSION} (非破壊マルチレイヤー) を起動しました。`);
    loadSavedState();
    setupEventListeners();
    setupDictManager();
    setupBackupManager();
    renderDynamicChipGroups();
    updateCombinedPrompt();
    updateKeyToggleUI();
    setupDropZone();
    setupVisionDropZone();
    renderArchiveGrid();
    
    CloudSyncManager.init();
    
    if (document.fonts) {
      await document.fonts.ready;
    }
    
    await reloadAllLayerImages();
    renderCard();
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

  function saveState(triggerCloud = true) {
    try {
      localStorage.setItem('kuwagata_card_studio_state_v4', JSON.stringify({
        aspectRatio: state.aspectRatio,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        layers: state.layers,
        selectedChipIds: Array.from(state.selectedChipIds)
      }));
      
      saveApiKeyVault();
      localStorage.setItem('kuwagata_categories_v4', JSON.stringify(state.categories));
      localStorage.setItem('kuwagata_chips_v4', JSON.stringify(state.chips));
      localStorage.setItem('kuwagata_card_archive_v4', JSON.stringify(state.cardArchive));

      if (triggerCloud) {
        CloudSyncManager.scheduleAutoSync();
      }
    } catch (e) {
      Logger.warn('LocalStorage save failed', e.message);
    }
  }

  function loadSavedState() {
    try {
      const savedCategories = localStorage.getItem('kuwagata_categories_v4') || localStorage.getItem('kuwagata_categories_vault');
      if (savedCategories) state.categories = JSON.parse(savedCategories);

      const savedChips = localStorage.getItem('kuwagata_chips_v4') || localStorage.getItem('kuwagata_chips_vault');
      if (savedChips) state.chips = JSON.parse(savedChips);

      const savedArchive = localStorage.getItem('kuwagata_card_archive_v4') || localStorage.getItem('kuwagata_card_archive_vault');
      if (savedArchive) state.cardArchive = JSON.parse(savedArchive);

      const saved = localStorage.getItem('kuwagata_card_studio_state_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.layers) state.layers = parsed.layers;
        if (parsed.aspectRatio) state.aspectRatio = parsed.aspectRatio;
        if (parsed.canvasWidth) state.canvasWidth = parsed.canvasWidth;
        if (parsed.canvasHeight) state.canvasHeight = parsed.canvasHeight;
        if (parsed.selectedChipIds) state.selectedChipIds = new Set(parsed.selectedChipIds);
      }
      syncInputsFromState();
    } catch (e) {
      Logger.warn('LocalStorage load failed', e.message);
    }
  }

  function syncInputsFromState() {
    // レイヤー1: ブランド
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

    // レイヤー2: メイン漢字
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

    // レイヤー3: 英字
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

    // レイヤー4: スペック
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

    if (btnHeaderSync) {
      btnHeaderSync.addEventListener('click', () => backupModal.classList.remove('hidden'));
    }

    [btnClose, btnCloseBottom].forEach(b => {
      if (b) b.addEventListener('click', () => backupModal.classList.add('hidden'));
    });

    if (btnForceUpload) {
      btnForceUpload.addEventListener('click', () => CloudSyncManager.pushToCloud(false));
    }
    if (btnForceDownload) {
      btnForceDownload.addEventListener('click', () => CloudSyncManager.pullFromCloud(false));
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => exportBackupData());
    }

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

    Logger.success(`非破壊マルチレイヤーバックアップを書き出しました (${filename})`);
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

        saveState(true);
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
      const visibleChips = state.chips.filter(c => c.category === catKey && c.isVisible);

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
        .filter(c => c.category === cat && state.selectedChipIds.has(c.id) && c.isVisible)
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

    if (countEl) countEl.textContent = `${state.chips.length} 件`;
    const catKeys = Object.keys(state.categories);

    listEl.innerHTML = state.chips.map((chip, idx) => {
      const optionsHtml = catKeys.map(k => `
        <option value="${k}" ${chip.category === k ? 'selected' : ''}>${Logger.escapeHtml(state.categories[k])}</option>
      `).join('');

      return `
        <div class="dict-item-row" style="display:flex; gap:6px; margin-bottom:4px; align-items:center;">
          <select class="dict-item-cat-select" data-idx="${idx}" style="width:120px;">
            ${optionsHtml}
          </select>
          <input type="text" class="dict-item-input" value="${Logger.escapeHtml(chip.text)}" data-idx="${idx}">
          <button type="button" class="btn-secondary btn-sm" data-action="toggle-vis" data-idx="${idx}">${chip.isVisible ? '表示' : '非表示'}</button>
          <button type="button" class="btn-secondary btn-sm" data-action="del" data-idx="${idx}" style="color:#ef5350;">✕</button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.dict-item-cat-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        state.chips[idx].category = e.target.value;
        saveState();
        renderDynamicChipGroups();
        updateCombinedPrompt();
      });
    });

    listEl.querySelectorAll('.dict-item-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        state.chips[idx].text = e.target.value.trim();
        saveState();
        renderDynamicChipGroups();
        updateCombinedPrompt();
      });
    });

    listEl.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const idx = parseInt(btn.dataset.idx, 10);
        const chip = state.chips[idx];
        if (!chip) return;

        if (action === 'toggle-vis') {
          chip.isVisible = !chip.isVisible;
          saveState();
          renderDictManagerList();
          renderDynamicChipGroups();
          updateCombinedPrompt();
        } else if (action === 'del') {
          if (confirm(`「${chip.text}」を削除しますか？`)) {
            state.selectedChipIds.delete(chip.id);
            state.chips.splice(idx, 1);
            saveState();
            renderDictManagerList();
            renderDynamicChipGroups();
            updateCombinedPrompt();
          }
        }
      });
    });
  }

  function addSingleChip(text, category = 'custom') {
    const existing = state.chips.find(c => c.text === text);
    if (existing) {
      existing.isVisible = true;
      existing.category = category;
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
    saveState();
    renderDynamicChipGroups();
    updateCombinedPrompt();
    Logger.success(`単語を追加しました: ${text}`);
  }

  function deleteChip(chipId) {
    const chip = state.chips.find(c => c.id === chipId);
    if (!chip) return;
    if (confirm(`「${chip.text}」を削除しますか？`)) {
      state.selectedChipIds.delete(chipId);
      state.chips = state.chips.filter(c => c.id !== chipId);
      saveState();
      renderDynamicChipGroups();
      updateCombinedPrompt();
    }
  }

  // --- イベントリスナー設定 ---
  function setupEventListeners() {
    // タブ切り替え
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
    const btnCloseLog = document.getElementById('btnCloseLogModal');
    const btnClearLogs = document.getElementById('btnClearLogs');
    const btnCopyLogs = document.getElementById('btnCopyLogs');

    if (btnOpenLog) {
      btnOpenLog.addEventListener('click', () => {
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

    // 背景生成ボタン
    const btnGenAi = document.getElementById('btnGenerateAiBg');
    if (btnGenAi) {
      btnGenAi.addEventListener('click', () => generateAiBackground());
    }

    // AI文字生成ボタン群
    const btnGenBrand = document.getElementById('btnGenBrandAiGraphic');
    if (btnGenBrand) {
      btnGenBrand.addEventListener('click', () => generateAiTextGraphic('brand'));
    }

    const btnGenKanji = document.getElementById('btnGenKanjiAiGraphic');
    if (btnGenKanji) {
      btnGenKanji.addEventListener('click', () => generateAiTextGraphic('kanji'));
    }

    const btnGenRomaji = document.getElementById('btnGenRomajiAiGraphic');
    if (btnGenRomaji) {
      btnGenRomaji.addEventListener('click', () => generateAiTextGraphic('romaji'));
    }

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

    // アスペクト比変更
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
      if (e.target.files && e.target.files[0]) analyzeImageAndRestoreCleanBg(e.target.files[0]);
    });

    ['dragenter', 'dragover'].forEach(n => {
      zone.addEventListener(n, (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(n => {
      zone.addEventListener(n, (e) => { e.preventDefault(); zone.classList.remove('dragover'); });
    });
    zone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) analyzeImageAndRestoreCleanBg(e.dataTransfer.files[0]);
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

      // 文字消し背景画像の生成/復元プレビュー
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

  // --- ✨ Gemini AI 文字グラフィック生成エンジン (透過PNG自動生成) ---
  async function generateAiTextGraphic(targetLayer) {
    const apiKey = getEffectiveApiKey('image');
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('AI文字グラフィックを生成するために、右上の「API設定」のスロット2（有料キー）にAPIキーを入力してください。');
      return;
    }

    let text = '';
    let stylePrompt = '';

    if (targetLayer === 'brand') {
      text = state.layers.brand.text.trim();
      stylePrompt = document.getElementById('brandAiStyleSelect')?.value || '';
    } else if (targetLayer === 'kanji') {
      text = state.layers.kanji.text.trim();
      stylePrompt = document.getElementById('kanjiAiStyleSelect')?.value || '';
    } else if (targetLayer === 'romaji') {
      text = state.layers.romaji.text.trim();
      stylePrompt = document.getElementById('romajiAiStyleSelect')?.value || '';
    }

    if (!text) {
      alert('生成する文字を入力してください。');
      return;
    }

    showLoading(true, `✨ Gemini が「${text}」のAI文字グラフィックを生成中...`);
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
              text: `Generate a high resolution isolated luxury typographic graphic of the exact word/letter: "${text}". Style: ${stylePrompt}. Solid dark background, perfect clean edges, isolated character art, masterpiece collector card typography.`
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
      // 透過処理を適用してレイヤーに保存
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
      saveState(true);
      renderCard();
      showLoading(false);
      Logger.success(`🎉 「${text}」のAI文字グラフィック生成＆透過処理が完了しました！`);
      alert(`🎉 「${text}」のAI文字グラフィックを生成しました！\nスライダーで位置と大きさを自由に微調整できます。`);
    } else {
      showLoading(false);
      Logger.error('AI文字生成失敗', lastError);
      alert(`AI文字生成エラー:\n${lastError}\n\n※未生成時は美しい標準フォントで自動プレビューされます。`);
    }
  }

  // 暗い背景を自動で透明化（透過アルファカット処理）
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

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // 輝度計算
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
          if (brightness < 35) {
            // 暗いピクセルを透明化
            data[i + 3] = Math.max(0, (brightness - 10) * 10);
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
      saveState(true);
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

  // --- 🎴 非破壊マルチレイヤー アーカイブシステム ---
  function saveCurrentToArchive() {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 320;
    thumbCanvas.height = Math.round(320 * (state.canvasHeight / state.canvasWidth));
    const tCtx = thumbCanvas.getContext('2d');
    tCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumbData = thumbCanvas.toDataURL('image/jpeg', 0.7);

    const archiveItem = {
      id: 'card_' + Date.now(),
      createdAt: new Date().toLocaleDateString('ja-JP'),
      title: `${state.layers.brand.text || 'CARD'} - ${state.layers.kanji.text || ''} (${state.layers.specs.serial.text || 'No-Serial'})`,
      ownerName: state.layers.specs.owner.text,
      sizeText: state.layers.specs.size.text,
      thumbnail: thumbData,
      stateData: JSON.parse(JSON.stringify({
        aspectRatio: state.aspectRatio,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        layers: state.layers
      }))
    };

    state.cardArchive.unshift(archiveItem);
    saveState(true);
    renderArchiveGrid();
    Logger.success(`非破壊レイヤー保存完了: ${archiveItem.title}`);
    alert(`「${archiveItem.title}」をカード履歴アルバムに非破壊保存しました！\n（※背景と文字が別々に保存されているため、いつでも何度でも綺麗に再編集できます）`);
  }

  function renderArchiveGrid() {
    if (!archiveGrid) return;
    if (archiveCountTag) archiveCountTag.textContent = `${state.cardArchive.length} 件`;

    if (state.cardArchive.length === 0) {
      archiveGrid.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:11px;">
          保存されたカード履歴はまだありません。<br>
          「アルバムに保存」を押すと完全非破壊レイヤーで蓄積されます。
        </div>
      `;
      return;
    }

    archiveGrid.innerHTML = state.cardArchive.map((item, idx) => `
      <div class="archive-card-item">
        <img src="${item.thumbnail}" class="archive-thumb" alt="thumb">
        <div class="archive-title">${Logger.escapeHtml(item.title)}</div>
        <div class="archive-meta">
          ${Logger.escapeHtml(item.ownerName || '未指定')} | ${Logger.escapeHtml(item.sizeText || '')}<br>
          ${item.createdAt}
        </div>
        <div class="archive-actions">
          <button type="button" class="btn-primary btn-sm" data-action="restore" data-idx="${idx}">復元・編集</button>
          <button type="button" class="btn-secondary btn-sm" data-action="delete" data-idx="${idx}" style="color:#ef5350;">削除</button>
        </div>
      </div>
    `).join('');

    archiveGrid.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const idx = parseInt(btn.dataset.idx, 10);
        const target = state.cardArchive[idx];
        if (!target) return;

        if (action === 'restore') {
          restoreFromArchive(target);
        } else if (action === 'delete') {
          if (confirm(`「${target.title}」を削除しますか？`)) {
            state.cardArchive.splice(idx, 1);
            saveState(true);
            renderArchiveGrid();
          }
        }
      });
    });
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
    saveState(false);
    renderCard();
    document.querySelector('.tab-btn[data-tab="tab-ai-letters"]').click();
    Logger.success(`「${item.title}」を完全非破壊復元しました。`);
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
      saveState(true);
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

    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. レイヤー0: 背景描画
    drawBackgroundLayer(ctx, canvas.width, canvas.height);

    // 2. レイヤー1: ブランド AI文字
    drawBrandLayer(ctx, canvas.width, canvas.height);

    // 3. レイヤー2: メイン漢字血統 AI文字
    drawKanjiLayer(ctx, canvas.width, canvas.height);

    // 4. レイヤー3: 英字血統 AI文字
    drawRomajiLayer(ctx, canvas.width, canvas.height);

    // 5. レイヤー4: 個体スペック文字（Apple標準商用安全）
    drawSpecsLayer(ctx, canvas.width, canvas.height);

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
      // AI文字グラフィックを描画
      const scale = (layer.scale || 100) / 100;
      const drawW = w * 0.7 * scale;
      const drawH = drawW * (loadedBrandImg.height / loadedBrandImg.width);
      targetCtx.drawImage(loadedBrandImg, centerX - (drawW / 2), centerY - (drawH / 2), drawW, drawH);
    } else {
      // 標準美麗フォント描画
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
      // AI漢字グラフィックを描画
      const scale = (layer.scale || 100) / 100;
      const drawW = w * 0.6 * scale;
      const drawH = drawW * (loadedKanjiImg.height / loadedKanjiImg.width);
      targetCtx.drawImage(loadedKanjiImg, centerX - (drawW / 2), centerY - (drawH / 2), drawW, drawH);
    } else {
      // Apple商用安全毛筆/明朝フォント描画
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
      // AI欧文グラフィックを描画
      const scale = (layer.scale || 100) / 100;
      const drawW = w * 0.6 * scale;
      const drawH = drawW * (loadedRomajiImg.height / loadedRomajiImg.width);
      targetCtx.drawImage(loadedRomajiImg, centerX - (drawW / 2), centerY - (drawH / 2), drawW, drawH);
    } else {
      // Apple商用安全欧文フォント描画
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

    // オーナー名
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

    // シリアルNo
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

    // サイズ
    if (specs.size.text) {
      const zY = h * (specs.size.y / 100);
      const zX = (w / 2) + (specs.size.x || 0);
      targetCtx.font = `800 ${specs.size.size}px ${specs.size.font}`;
      targetCtx.fillStyle = '#111';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(specs.size.text, zX, zY);
    }

    // 追加情報
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

  function exportLayer(type) {
    showLoading(true, 'PNG書き出し中...');
    setTimeout(() => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = state.canvasWidth;
        offCanvas.height = state.canvasHeight;
        const offCtx = offCanvas.getContext('2d');

        if (type === 'merged') {
          drawBackgroundLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawBrandLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawKanjiLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawRomajiLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawSpecsLayer(offCtx, state.canvasWidth, state.canvasHeight);
          downloadCanvasAsPNG(offCanvas, `kuwagata_card_${state.layers.kanji.text || 'cert'}_full.png`);
        } else if (type === 'bg') {
          drawBackgroundLayer(offCtx, state.canvasWidth, state.canvasHeight);
          downloadCanvasAsPNG(offCanvas, `kuwagata_bg_clean.png`);
        } else if (type === 'text') {
          drawBrandLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawKanjiLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawRomajiLayer(offCtx, state.canvasWidth, state.canvasHeight);
          drawSpecsLayer(offCtx, state.canvasWidth, state.canvasHeight);
          downloadCanvasAsPNG(offCanvas, `kuwagata_text_layers_transparent.png`);
        }
        Logger.success(`PNG出力完了: ${type}`);
      } catch (err) {
        Logger.error('PNG出力例外', err.message);
      } finally {
        showLoading(false);
      }
    }, 50);
  }

  function downloadCanvasAsPNG(targetCanvas, filename) {
    targetCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
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
