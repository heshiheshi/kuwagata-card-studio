/**
 * KUWAGATA PREMIUM CARD STUDIO - APPLICATION ENGINE (v3.0.0 Cloudflare KV Production Edition)
 * Official Cloudflare KV Database Direct Sync, Private Auth Gate, Dual-Key Defense & Gemini Vision/Image
 */

(function () {
  'use strict';

  const APP_VERSION = 'v3.0.0';
  const VALID_PASSCODES = ['lojing2026', 'kuwagata2026', '7777'];
  const CLOUD_SYNC_ENDPOINT = '/api/sync';

  // --- システムロガー (System Logger) ---
  const Logger = {
    logs: [],
    maxLogs: 200,

    add(type, msg, rawData = null) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      
      const entry = {
        time: timeStr,
        type: type,
        msg: msg,
        rawData: rawData
      };

      this.logs.unshift(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.pop();
      }

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
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  };

  // --- デフォルト カテゴリ定義 ---
  const DEFAULT_CATEGORIES = {
    prefix: '目的・指示文',
    texture: '質感・ベース',
    color: '色彩・水彩',
    decor: '装飾・エフェクト',
    quality: '構図・品質',
    custom: '自作単語・登録'
  };

  // --- デフォルト単語チップ定義 ---
  const DEFAULT_CHIPS = [
    { id: 'c_pre_1', category: 'prefix', text: '最高峰クワガタの血統証明・トレーディングカード用の背景グラフィック画像を生成してください。', isVisible: true, isCustom: false },
    { id: 'c_pre_2', category: 'prefix', text: '高級コレクターズカードの背景テクスチャを作成してください。', isVisible: true, isCustom: false },
    { id: 'c_pre_3', category: 'prefix', text: '美術絵画のような重厚な和風グラフィックを生成してください。', isVisible: true, isCustom: false },
    { id: 'c_tex_1', category: 'texture', text: '和紙の質感', isVisible: true, isCustom: false },
    { id: 'c_tex_2', category: 'texture', text: '上質な生成り和紙', isVisible: true, isCustom: false },
    { id: 'c_tex_3', category: 'texture', text: '漆黒の重厚な背景', isVisible: true, isCustom: false },
    { id: 'c_tex_4', category: 'texture', text: '黒曜石の鉱物テクスチャ', isVisible: true, isCustom: false },
    { id: 'c_tex_5', category: 'texture', text: '高級大理石調', isVisible: true, isCustom: false },
    { id: 'c_col_1', category: 'color', text: '中央に透明感のある翡翠色・深緑色の水彩シェイプ', isVisible: true, isCustom: false },
    { id: 'c_col_2', category: 'color', text: '中央に深紅・ルビー色のクリスタル水彩グラデーション', isVisible: true, isCustom: false },
    { id: 'c_col_3', category: 'color', text: '黄金の木漏れ日と光彩グラデーション', isVisible: true, isCustom: false },
    { id: 'c_col_4', category: 'color', text: '紫電とロイヤルパープルのオーラ', isVisible: true, isCustom: false },
    { id: 'c_col_5', category: 'color', text: '琥珀アンバーとゴールドの輝き', isVisible: true, isCustom: false },
    { id: 'c_dec_1', category: 'decor', text: '細やかな金箔の散らし', isVisible: true, isCustom: false },
    { id: 'c_dec_2', category: 'decor', text: '優美な蒔絵風ゴールドの光沢', isVisible: true, isCustom: false },
    { id: 'c_dec_3', category: 'decor', text: 'クリスタルカットの透明感', isVisible: true, isCustom: false },
    { id: 'c_dec_4', category: 'decor', text: '外周の繊細な光沢エッジ', isVisible: true, isCustom: false },
    { id: 'c_dec_5', category: 'decor', text: '神聖な光の粒子', isVisible: true, isCustom: false },
    { id: 'c_qua_1', category: 'quality', text: '文字配置用の中央クリーン構図', isVisible: true, isCustom: false },
    { id: 'c_qua_2', category: 'quality', text: '文字やロゴなどのテキストは一切描かないでください（文字なし）', isVisible: true, isCustom: false },
    { id: 'c_qua_3', category: 'quality', text: '最高峰コレクターズ品質、8K高精細', isVisible: true, isCustom: false },
    { id: 'c_cus_1', category: 'custom', text: '阿古谷血統のダークグリーン水彩', isVisible: true, isCustom: true },
    { id: 'c_cus_2', category: 'custom', text: '極太アゴに合う重厚な漆黒', isVisible: true, isCustom: true }
  ];

  // --- 状態管理 (State) ---
  const state = {
    // 🛡️ APIキーは端末内完全ローカル隔離 (Cloudflare KV同期対象外)
    freeApiKey: '',
    paidApiKey: '',
    activeKeyMode: 'free',

    aspectRatio: '5:7',
    aiAspectRatio: '3:4',
    canvasWidth: 1500,
    canvasHeight: 2100,
    exportScale: 1.0,

    aiPrompt: '',
    categories: { ...DEFAULT_CATEGORIES },
    chips: [...DEFAULT_CHIPS],
    selectedChipIds: new Set(['c_pre_1', 'c_tex_1', 'c_col_1', 'c_dec_1', 'c_qua_1', 'c_qua_2', 'c_qua_3']),

    cardArchive: [],
    lastExtractedPrompt: null,

    bgType: 'image',
    bgImageSrc: 'assets/bg_default.jpg',
    bgBrightness: 100,

    brandText: 'LOJING',
    brandRedInitial: true,
    
    kanjiText: '蒼',
    kanjiFont: "'Yuji Boku', serif",
    kanjiSizeScale: 100,

    romajiText: 'AOI',
    romajiFont: "'Cinzel', serif",

    ownerLabel: 'Owner',
    ownerName: '佃 宗行 様',

    serialText: 'NO.AS-05',
    sizeText: '♂77mm',
    extraInfoText: '',

    goldStyle: 'royal',
    textShadowStrength: 70,
    verticalOffset: 0,
  };

  let loadedBgImage = null;
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

  // --- 🧹 古いキャッシュの自動クリーンアップ (iOS Quota Defense) ---
  function cleanupLegacyCache() {
    try {
      const keysToClean = [
        'kuwagata_card_studio_state_v23', 'kuwagata_card_studio_state_v24', 'kuwagata_card_studio_state_v25', 'kuwagata_card_studio_state_v26', 'kuwagata_card_studio_state_v27', 'kuwagata_card_studio_state_v28',
        'kuwagata_card_archive_v23', 'kuwagata_card_archive_v24', 'kuwagata_card_archive_v25', 'kuwagata_card_archive_v26', 'kuwagata_card_archive_v27', 'kuwagata_card_archive_v28',
        'kuwagata_cloud_sync_master_v27'
      ];
      keysToClean.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
  }

  // --- ☁️ Cloudflare KV 公式データベース同期エンジン (v3.0.0) ---
  const CloudSyncManager = {
    syncTimer: null,
    isSyncing: false,
    lastSyncedTime: null,

    init() {
      this.updateIndicator('online', 'Cloudflare KV 準備完了');
      // 起動時に自動でCloudflare KVから最新データを取得
      this.pullFromCloud(true);
    },

    // 🛡️ APIキーを完全除外した安全共有ペイロード
    getSanitizedPayload() {
      const compressedArchive = state.cardArchive.map(item => {
        return {
          id: item.id,
          createdAt: item.createdAt,
          title: item.title,
          ownerName: item.ownerName,
          sizeText: item.sizeText,
          thumbnail: item.thumbnail,
          stateData: {
            aspectRatio: item.stateData.aspectRatio || '5:7',
            canvasWidth: item.stateData.canvasWidth || 1500,
            canvasHeight: item.stateData.canvasHeight || 2100,
            brandText: item.stateData.brandText || '',
            brandRedInitial: item.stateData.brandRedInitial ?? true,
            kanjiText: item.stateData.kanjiText || '',
            kanjiFont: item.stateData.kanjiFont || "'Yuji Boku', serif",
            romajiText: item.stateData.romajiText || '',
            romajiFont: item.stateData.romajiFont || "'Cinzel', serif",
            ownerLabel: item.stateData.ownerLabel || 'Owner',
            ownerName: item.stateData.ownerName || '',
            serialText: item.stateData.serialText || '',
            sizeText: item.stateData.sizeText || '',
            extraInfoText: item.stateData.extraInfoText || '',
            verticalOffset: item.stateData.verticalOffset || 0,
            bgType: item.stateData.bgType || 'image',
            bgImageSrc: (item.stateData.bgImageSrc && !item.stateData.bgImageSrc.startsWith('data:')) ? item.stateData.bgImageSrc : item.thumbnail
          }
        };
      });

      const payload = {
        studio: 'KUWAGATA_PREMIUM_STUDIO',
        version: APP_VERSION,
        categories: state.categories,
        chips: state.chips,
        selectedChipIds: Array.from(state.selectedChipIds),
        cardArchive: compressedArchive,
        updatedAt: Date.now()
      };
      
      delete payload.freeApiKey;
      delete payload.paidApiKey;
      delete payload.activeKeyMode;
      return payload;
    },

    scheduleAutoSync() {
      clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => {
        this.pushToCloud(true);
      }, 1000);
    },

    async pushToCloud(silent = true) {
      if (this.isSyncing) return;
      this.isSyncing = true;
      this.updateIndicator('syncing', 'Cloudflare KV へ送信中...');

      const payload = this.getSanitizedPayload();
      const payloadJson = JSON.stringify(payload);
      const sizeKB = Math.round(payloadJson.length / 1024);

      Logger.api(`Cloudflare KV 送信開始 (サイズ: ${sizeKB} KB, カード: ${payload.cardArchive.length} 枚)`);

      try {
        const resp = await fetch(CLOUD_SYNC_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadJson
        });

        if (resp.ok) {
          this.lastSyncedTime = new Date();
          this.updateIndicator('online', `同期完了 (${this.formatTime(this.lastSyncedTime)})`);
          Logger.success(`🎉 Cloudflare KV 保存完全成功！ [${sizeKB} KB] (単語: ${payload.chips.length}, カード: ${payload.cardArchive.length})`);
          if (!silent) {
            alert(`🎉 Cloudflare KV へ手動上書き送信が完了しました！\n\n・単語辞書: ${payload.chips.length} 件\n・カード履歴: ${payload.cardArchive.length} 件 (${sizeKB} KB)\n\nMac・iPhone・相方様の全端末へ即座に反映されます。`);
          }
        } else {
          throw new Error(`HTTP ${resp.status}`);
        }
      } catch (err) {
        this.updateIndicator('online', 'ローカル保存済み');
        Logger.warn('Cloudflare KV 送信例外', err.message);
        if (!silent) {
          alert('Cloudflare KV 送信通知: ' + err.message);
        }
      } finally {
        this.isSyncing = false;
      }
    },

    async pullFromCloud(silent = true) {
      if (this.isSyncing) return;
      this.isSyncing = true;
      this.updateIndicator('syncing', 'Cloudflare KV から取得中...');

      try {
        const resp = await fetch(CLOUD_SYNC_ENDPOINT);
        if (resp.ok) {
          const data = await resp.json();

          if (data && (data.studio === 'KUWAGATA_PREMIUM_STUDIO' || Array.isArray(data.cardArchive))) {
            if (data.categories && Object.keys(data.categories).length > 0) {
              state.categories = data.categories;
            }

            if (data.chips && Array.isArray(data.chips) && data.chips.length > 0) {
              state.chips = data.chips;
            }

            if (data.selectedChipIds && Array.isArray(data.selectedChipIds)) {
              state.selectedChipIds = new Set(data.selectedChipIds);
            }

            if (data.cardArchive && Array.isArray(data.cardArchive)) {
              state.cardArchive = data.cardArchive;
            }

            saveState(false);
            renderDynamicChipGroups();
            updateCombinedPrompt();
            renderArchiveGrid();

            this.lastSyncedTime = new Date(data.updatedAt || Date.now());
            this.updateIndicator('online', `同期完了 (${this.formatTime(this.lastSyncedTime)})`);
            Logger.success(`🎉 Cloudflare KV 受信完了！ (単語: ${state.chips.length}, カード履歴: ${state.cardArchive.length} 枚)`);
            if (!silent) {
              alert(`🎉 Cloudflare KV から最新データを取得しました！\n\n・単語辞書: ${state.chips.length} 件\n・カード履歴: ${state.cardArchive.length} 件\n\n画面を最新状態に上書き更新しました。`);
            }
          }
        }
      } catch (err) {
        this.updateIndicator('online', '同期準備完了');
        Logger.warn('Cloudflare KV 受信通知', err.message);
      } finally {
        this.isSyncing = false;
      }
    },

    updateIndicator(status, text) {
      const dot = document.getElementById('headerSyncDot');
      const label = document.getElementById('headerSyncText');
      const badge = document.getElementById('modalSyncBadge');
      const statusText = document.getElementById('cloudSyncStatusText');

      if (dot) {
        dot.className = `sync-status-dot ${status}`;
      }
      if (label) {
        label.textContent = status === 'syncing' ? '同期中...' : 'Cloudflare同期';
      }
      if (badge) {
        badge.textContent = status === 'syncing' ? '🔄 同期中' : '🟢 接続中';
      }
      if (statusText) {
        statusText.textContent = `最終同期: ${text}`;
      }
    },

    formatTime(d) {
      return d.toTimeString().split(' ')[0];
    }
  };

  async function init() {
    cleanupLegacyCache();
    setupAuthGate();
    Logger.info(`Kuwagata Card Studio ${APP_VERSION} を起動しました。`);
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
    
    // ☁️ Cloudflare KV 自動同期の起動
    CloudSyncManager.init();
    
    if (document.fonts) {
      Logger.info('Webフォントのロードを開始...');
      await document.fonts.ready;
      Logger.success('Webフォントのロードが完了しました。');
    }
    
    await loadInitialBackground();
    renderCard();
  }

  // --- 🔒 パスワード認証ゲート (Auth Gate) ---
  function setupAuthGate() {
    const overlay = document.getElementById('authGateOverlay');
    const form = document.getElementById('authGateForm');
    const input = document.getElementById('authPassInput');
    const errorMsg = document.getElementById('authErrorMsg');

    const isAuth = localStorage.getItem('kuwagata_auth_passed_v30') === 'true' || 
                   sessionStorage.getItem('kuwagata_auth_passed_v30') === 'true' ||
                   localStorage.getItem('kuwagata_auth_passed_v29') === 'true' ||
                   localStorage.getItem('kuwagata_auth_passed_v28') === 'true';

    if (isAuth) {
      if (overlay) overlay.classList.add('authenticated');
      return;
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = (input.value || '').trim();
        if (VALID_PASSCODES.includes(pass.toLowerCase())) {
          localStorage.setItem('kuwagata_auth_passed_v30', 'true');
          sessionStorage.setItem('kuwagata_auth_passed_v30', 'true');
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
      localStorage.setItem('kuwagata_card_studio_state_v30', JSON.stringify({
        ...state,
        selectedChipIds: Array.from(state.selectedChipIds),
        bgImageSrc: state.bgImageSrc.startsWith('data:') ? 'assets/bg_default.jpg' : state.bgImageSrc
      }));
      
      // 🛡️ APIキーは端末ローカルにのみ保存
      localStorage.setItem('kuwagata_free_api_key_v30', state.freeApiKey);
      localStorage.setItem('kuwagata_paid_api_key_v30', state.paidApiKey);
      localStorage.setItem('kuwagata_active_key_mode_v30', state.activeKeyMode);

      localStorage.setItem('kuwagata_categories_v30', JSON.stringify(state.categories));
      localStorage.setItem('kuwagata_chips_v30', JSON.stringify(state.chips));
      localStorage.setItem('kuwagata_card_archive_v30', JSON.stringify(state.cardArchive));

      if (triggerCloud) {
        CloudSyncManager.scheduleAutoSync();
      }
    } catch (e) {
      Logger.warn('LocalStorage save failed', e.message);
    }
  }

  function loadSavedState() {
    try {
      const savedFree = localStorage.getItem('kuwagata_free_api_key_v30') || localStorage.getItem('kuwagata_free_api_key_v29') || localStorage.getItem('kuwagata_free_api_key_v28') || '';
      const savedPaid = localStorage.getItem('kuwagata_paid_api_key_v30') || localStorage.getItem('kuwagata_paid_api_key_v29') || '';
      const savedMode = localStorage.getItem('kuwagata_active_key_mode_v30') || 'free';

      state.freeApiKey = savedFree;
      state.paidApiKey = savedPaid;
      state.activeKeyMode = savedMode;

      const savedCategories = localStorage.getItem('kuwagata_categories_v30') || localStorage.getItem('kuwagata_categories_v29') || localStorage.getItem('kuwagata_categories_v28');
      if (savedCategories) {
        state.categories = JSON.parse(savedCategories);
      }

      const savedChips = localStorage.getItem('kuwagata_chips_v30') || localStorage.getItem('kuwagata_chips_v29') || localStorage.getItem('kuwagata_chips_v28');
      if (savedChips) {
        state.chips = JSON.parse(savedChips);
      }

      const savedArchive = localStorage.getItem('kuwagata_card_archive_v30') || localStorage.getItem('kuwagata_card_archive_v29') || localStorage.getItem('kuwagata_card_archive_v28');
      if (savedArchive) {
        state.cardArchive = JSON.parse(savedArchive);
      }

      const saved = localStorage.getItem('kuwagata_card_studio_state_v30') || localStorage.getItem('kuwagata_card_studio_state_v29') || localStorage.getItem('kuwagata_card_studio_state_v28');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedChipIds) {
          state.selectedChipIds = new Set(parsed.selectedChipIds);
        }
        delete parsed.selectedChipIds;
        delete parsed.chips;
        delete parsed.categories;
        Object.assign(state, parsed);
        syncInputsFromState();
        Logger.info('前回の設定を復元しました。');
      }
    } catch (e) {
      Logger.warn('LocalStorage load failed', e.message);
    }
  }

  function syncInputsFromState() {
    setVal('brandText', state.brandText);
    setCheck('brandRedInitial', state.brandRedInitial);
    setVal('kanjiText', state.kanjiText);
    setVal('kanjiFont', state.kanjiFont);
    setVal('romajiText', state.romajiText);
    setVal('romajiFont', state.romajiFont);
    setVal('ownerLabel', state.ownerLabel);
    setVal('ownerName', state.ownerName);
    setVal('serialText', state.serialText);
    setVal('sizeText', state.sizeText);
    setVal('extraInfoText', state.extraInfoText);

    setVal('verticalOffset', state.verticalOffset);
    setVal('verticalOffsetVal', state.verticalOffset + 'px');

    document.querySelectorAll('.ratio-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ratio === state.aspectRatio);
    });
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
    const btnOpen = document.getElementById('btnOpenBackupModal');
    const btnHeaderSync = document.getElementById('btnHeaderCloudSync');
    const btnClose = document.getElementById('btnCloseBackupModal');
    const btnCloseBottom = document.getElementById('btnCloseBackupModalBottom');
    const btnExport = document.getElementById('btnExportBackup');
    const btnTriggerImport = document.getElementById('btnTriggerImport');
    const fileInput = document.getElementById('backupFileInput');

    const btnForceUpload = document.getElementById('btnForceUploadCloud');
    const btnForceDownload = document.getElementById('btnForceDownloadCloud');

    [btnOpen, btnHeaderSync].forEach(btn => {
      if (btn) btn.addEventListener('click', () => backupModal.classList.remove('hidden'));
    });

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
    const filename = `kuwagata_studio_backup_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    Logger.success(`手動バックアップを書き出しました (${filename})`);
    alert(`🎉 バックアップファイルをダウンロードしました！\n\nファイル名: ${filename}`);
  }

  function importBackupData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || data.studio !== 'KUWAGATA_PREMIUM_STUDIO') {
          throw new Error('クワガタカードスタジオのバックアップファイルではありません。');
        }

        if (data.categories) state.categories = data.categories;
        if (data.chips && Array.isArray(data.chips)) state.chips = data.chips;
        if (data.selectedChipIds && Array.isArray(data.selectedChipIds)) state.selectedChipIds = new Set(data.selectedChipIds);
        if (data.cardArchive && Array.isArray(data.cardArchive)) state.cardArchive = data.cardArchive;

        saveState(true); // クラウドへ自動アップロード
        renderDynamicChipGroups();
        updateCombinedPrompt();
        renderArchiveGrid();

        Logger.success('バックアップデータのインポート＆Cloudflare KV同期完了', { chipsCount: state.chips.length, archiveCount: state.cardArchive.length });
        alert(`🎉 データを正常に復元し、Cloudflare KVへ同期しました！\n\n・単語辞書: ${state.chips.length} 件\n・発行済みカード履歴: ${state.cardArchive.length} 件\n\nすべての端末で共有されます。`);
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
      btnQuickToggleKey.className = 'btn-key-toggle paid';
      keyModeLabel.textContent = '👑 有料キー';
    } else {
      btnQuickToggleKey.className = 'btn-key-toggle free';
      keyModeLabel.textContent = '🟢 無料キー';
    }
  }

  function getEffectiveApiKey(purpose = 'any') {
    if (purpose === 'image') {
      return state.paidApiKey || state.freeApiKey;
    } else if (purpose === 'text') {
      return state.freeApiKey || state.paidApiKey;
    }
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

      if (catKey === 'quality') {
        const ratioChipEl = document.createElement('button');
        ratioChipEl.type = 'button';
        ratioChipEl.className = 'word-chip active';
        ratioChipEl.style.borderColor = 'var(--border-gold)';
        ratioChipEl.style.color = 'var(--gold-text)';
        ratioChipEl.textContent = `比率 ${state.aspectRatio} (連動中)`;
        gridEl.appendChild(ratioChipEl);
      }

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

    const fullPrompt = '【プロンプト指示】\n・' + selectedTexts.join('\n・');
    state.aiPrompt = fullPrompt;
    if (aiPromptInput) {
      aiPromptInput.value = fullPrompt;
    }
  }

  // --- 辞書 ＆ カテゴリマネージャー ---
  function setupDictManager() {
    const btnOpen = document.getElementById('btnOpenDictManager');
    const btnQuickOpen = document.getElementById('btnQuickOpenDict');
    const btnClose = document.getElementById('btnCloseDictManager');
    const btnCloseBottom = document.getElementById('btnCloseDictModalBottom');
    const btnShowAll = document.getElementById('btnShowAllChips');

    [btnOpen, btnQuickOpen].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        renderCategoryInputs();
        renderDictCategorySelect();
        renderDictManagerList();
        dictManagerModal.classList.remove('hidden');
      });
    });

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
        Logger.info('すべての単語を表示状態に復元しました。');
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
      quickInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const text = quickInput.value.trim();
          if (!text) return;
          addSingleChip(text, 'custom');
          quickInput.value = '';
        }
      });
    }
  }

  function renderCategoryInputs() {
    const grid = document.getElementById('categoryInputsGrid');
    if (!grid) return;

    grid.innerHTML = Object.keys(state.categories).map(key => `
      <div class="category-input-row">
        <label>${key}:</label>
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
          Logger.info(`カテゴリ名リネーム [${catKey}]: ${newName}`);
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
        <div class="dict-item-row ${!chip.isVisible ? 'hidden-chip' : ''}">
          <select class="dict-item-cat-select" data-idx="${idx}">
            ${optionsHtml}
          </select>
          <input type="text" class="dict-item-input" value="${Logger.escapeHtml(chip.text)}" data-idx="${idx}" placeholder="単語テキストを入力...">
          <div class="dict-item-actions">
            <button type="button" class="btn-toggle-vis ${!chip.isVisible ? 'off' : ''}" data-action="toggle-vis" data-idx="${idx}" title="${chip.isVisible ? '非表示にして画面をスッキリ' : '表示に戻す'}">
              ${chip.isVisible ? '表示' : '非表示'}
            </button>
            <button type="button" class="btn-chip-del" data-action="del" data-idx="${idx}" title="削除">✕</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.dict-item-cat-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const newCat = e.target.value;
        if (state.chips[idx]) {
          state.chips[idx].category = newCat;
          saveState();
          renderDynamicChipGroups();
          updateCombinedPrompt();
          Logger.info(`単語カテゴリ変更 [${state.chips[idx].text}] -> ${state.categories[newCat]}`);
        }
      });
    });

    listEl.querySelectorAll('.dict-item-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const newText = e.target.value.trim();
        if (newText && state.chips[idx]) {
          state.chips[idx].text = newText;
          saveState();
          renderDynamicChipGroups();
          updateCombinedPrompt();
          Logger.info(`単語テキスト修正 [${state.chips[idx].id}]: ${newText}`);
        }
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
          Logger.info(`単語表示切り替え: ${chip.text} -> ${chip.isVisible ? '表示' : '非表示'}`);
        } else if (action === 'del') {
          if (confirm(`「${chip.text}」を辞書から削除しますか？`)) {
            state.selectedChipIds.delete(chip.id);
            state.chips.splice(idx, 1);
            saveState();
            renderDictManagerList();
            renderDynamicChipGroups();
            updateCombinedPrompt();
            Logger.info(`単語削除: ${chip.text}`);
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
    Logger.success(`単語を追加しました: ${text} (${state.categories[category] || category})`);
  }

  function deleteChip(chipId) {
    const chip = state.chips.find(c => c.id === chipId);
    if (!chip) return;
    if (confirm(`「${chip.text}」を辞書から削除しますか？`)) {
      state.selectedChipIds.delete(chipId);
      state.chips = state.chips.filter(c => c.id !== chipId);
      saveState();
      renderDynamicChipGroups();
      updateCombinedPrompt();
      Logger.info(`単語削除: ${chip.text}`);
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
        saveState();
        updateKeyToggleUI();
        Logger.info(`APIキーモード変更: ${state.activeKeyMode === 'paid' ? '👑 有料キー' : '🟢 無料キー'}`);
      });
    }

    const btnOpenModal = document.getElementById('btnOpenApiKeyModal');
    const btnCloseModal = document.getElementById('btnCloseApiKeyModal');
    const btnCancelModal = document.getElementById('btnCancelApiKey');
    const btnSaveModal = document.getElementById('btnSaveApiKey');

    btnOpenModal.addEventListener('click', () => {
      if (freeApiKeyInput) freeApiKeyInput.value = state.freeApiKey || '';
      if (paidApiKeyInput) paidApiKeyInput.value = state.paidApiKey || '';
      apiKeyModal.classList.remove('hidden');
    });

    [btnCloseModal, btnCancelModal].forEach(btn => {
      if (btn) btn.addEventListener('click', () => apiKeyModal.classList.add('hidden'));
    });

    btnSaveModal.addEventListener('click', () => {
      state.freeApiKey = (freeApiKeyInput ? freeApiKeyInput.value : '').trim();
      state.paidApiKey = (paidApiKeyInput ? paidApiKeyInput.value : '').trim();
      saveState(false); // APIキー変更はクラウド同期しない
      updateKeyToggleUI();
      apiKeyModal.classList.add('hidden');
      Logger.success('Gemini APIキー設定を端末内に保存しました。');
      alert('APIキー設定を端末内に安全に保存しました。\n（※クラウドへは一切送信されません）');
    });

    const btnOpenLog = document.getElementById('btnOpenLogModal');
    const btnCloseLog = document.getElementById('btnCloseLogModal');
    const btnClearLogs = document.getElementById('btnClearLogs');
    const btnCopyLogs = document.getElementById('btnCopyLogs');

    btnOpenLog.addEventListener('click', () => {
      Logger.updateUI();
      logModal.classList.remove('hidden');
    });

    if (btnCloseLog) btnCloseLog.addEventListener('click', () => logModal.classList.add('hidden'));
    if (btnClearLogs) btnClearLogs.addEventListener('click', () => Logger.clear());
    if (btnCopyLogs) {
      btnCopyLogs.addEventListener('click', () => {
        const text = Logger.getAllText();
        navigator.clipboard.writeText(text).then(() => {
          btnCopyLogs.textContent = 'コピー完了！';
          setTimeout(() => { btnCopyLogs.textContent = 'ログを全件コピー'; }, 2000);
          Logger.info('全システムログをコピーしました。');
        });
      });
    }

    const btnCopyCombined = document.getElementById('btnCopyCombinedPrompt');
    if (btnCopyCombined) {
      btnCopyCombined.addEventListener('click', () => {
        const text = aiPromptInput.value.trim();
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
          btnCopyCombined.innerHTML = '<span>コピー完了！Web版Geminiへ貼り付けてください</span>';
          setTimeout(() => {
            btnCopyCombined.innerHTML = '<span>組み合わせプロンプトを一括コピー</span>';
          }, 2000);
          Logger.info('組み合わせプロンプトをクリップボードにコピーしました。');
        });
      });
    }

    if (aiPromptInput) {
      aiPromptInput.addEventListener('input', (e) => {
        state.aiPrompt = e.target.value;
        saveState();
      });
    }

    const textInputIds = [
      'brandText', 'kanjiText', 'romajiText', 'ownerLabel', 
      'ownerName', 'serialText', 'sizeText', 'extraInfoText'
    ];
    textInputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          state[id] = e.target.value;
          saveState();
          renderCard();
        });
      }
    });

    const chkBrandRed = document.getElementById('brandRedInitial');
    if (chkBrandRed) {
      chkBrandRed.addEventListener('change', (e) => {
        state.brandRedInitial = e.target.checked;
        saveState();
        renderCard();
      });
    }

    ['kanjiFont', 'romajiFont'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          state[id] = e.target.value;
          saveState();
          renderCard();
        });
      }
    });

    bindSlider('verticalOffset', (val) => {
      state.verticalOffset = parseInt(val, 10);
      document.getElementById('verticalOffsetVal').textContent = val + 'px';
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
        
        renderDynamicChipGroups();
        updateCombinedPrompt();

        Logger.info(`アスペクト比変更: ${state.aspectRatio}`);
        saveState();
        renderCard();
      });
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const src = btn.dataset.src;
        if (src.startsWith('assets/')) {
          state.bgType = 'image';
          state.bgImageSrc = src;
          loadBackgroundImage(src);
        } else {
          state.bgType = src;
          renderCard();
        }
      });
    });

    document.getElementById('btnRerender').addEventListener('click', () => renderCard());

    document.getElementById('btnResetSample').addEventListener('click', () => {
      state.brandText = 'LOJING';
      state.brandRedInitial = true;
      state.kanjiText = '蒼';
      state.kanjiFont = "'Yuji Boku', serif";
      state.romajiText = 'AOI';
      state.romajiFont = "'Cinzel', serif";
      state.ownerLabel = 'Owner';
      state.ownerName = '佃 宗行 様';
      state.serialText = 'NO.AS-05';
      state.sizeText = '♂77mm';
      state.extraInfoText = '';
      state.verticalOffset = 0;
      syncInputsFromState();
      saveState();
      renderCard();
      Logger.info('サンプル状態にリセット');
    });

    document.getElementById('btnClearInputs').addEventListener('click', () => {
      state.brandText = '';
      state.kanjiText = '';
      state.romajiText = '';
      state.ownerName = '';
      state.serialText = '';
      state.sizeText = '';
      state.extraInfoText = '';
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

    const btnGenAi = document.getElementById('btnGenerateAiBg');
    if (btnGenAi) {
      btnGenAi.addEventListener('click', () => generateAiBackgroundRobust());
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

  // --- Vision AI: 画像解析プロンプト抽出 (無料キー優先) ---
  function setupVisionDropZone() {
    const zone = document.getElementById('visionDropZone');
    const input = document.getElementById('visionFileInput');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) analyzeImageForPrompt(e.target.files[0]);
    });

    ['dragenter', 'dragover'].forEach(n => {
      zone.addEventListener(n, (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(n => {
      zone.addEventListener(n, (e) => { e.preventDefault(); zone.classList.remove('dragover'); });
    });
    zone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) analyzeImageForPrompt(e.dataTransfer.files[0]);
    });

    const btnApplyBuilder = document.getElementById('btnApplyExtractedToBuilder');
    if (btnApplyBuilder) {
      btnApplyBuilder.addEventListener('click', () => {
        if (!state.lastExtractedPrompt) return;
        aiPromptInput.value = state.lastExtractedPrompt.ja;
        state.aiPrompt = state.lastExtractedPrompt.ja;
        saveState();
        document.querySelector('.tab-btn[data-tab="tab-prompt-builder"]').click();
        Logger.info('解析プロンプトをビルダーへ転送しました。');
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

        if (validPhrases.length === 0) {
          addSingleChip(rawJa, 'custom');
          alert(`「${rawJa}」を辞書に登録しました。`);
        } else {
          validPhrases.forEach(phrase => {
            addSingleChip(phrase, 'custom');
          });
          btnSaveLib.textContent = '分割登録完了！';
          setTimeout(() => { btnSaveLib.textContent = '単語ごとに分割して辞書に保存'; }, 2000);
          Logger.success(`抽出プロンプトを ${validPhrases.length} 件の単語パーツに分解して登録しました:`, validPhrases);
          alert(`以下の ${validPhrases.length} 件の単語パーツに分割して辞書に登録しました！\n\n・` + validPhrases.join('\n・') + `\n\n「辞書・カテゴリ管理」からカテゴリを自由に変更できます。`);
        }
      });
    }
  }

  async function analyzeImageForPrompt(file) {
    const apiKey = getEffectiveApiKey('text');
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      alert('画像解析を行うために、右上の「API設定」から無料APIキーを入力してください。');
      return;
    }

    const isCleanBgOnly = document.getElementById('chkCleanBackgroundOnly')?.checked ?? true;
    const promptArea = document.getElementById('visionUploadPrompt');
    const loadingInline = document.getElementById('visionLoadingInline');
    const resultArea = document.getElementById('visionResultArea');

    if (promptArea) promptArea.classList.add('hidden');
    if (loadingInline) loadingInline.classList.remove('hidden');
    if (resultArea) resultArea.classList.add('hidden');

    showLoading(true, 'Gemini 3.6 Flash が画像を解析中...');
    Logger.api(`Vision AI 解析開始: ${file.name} (無料枠優先キー使用)`);

    try {
      const base64Data = await readFileAsBase64(file);
      const mimeType = file.type || 'image/jpeg';

      const promptInstruction = `あなたは画像生成AIプロンプトの最高峰エンジニアです。
添付されたカード画像を詳細に解析してください。

${isCleanBgOnly ? `【最重要指示: 文字・ロゴの完全除去】
添付された画像には「LOJING」「蒼」「♂77mm」「Owner」などの文字や数字・ロゴが印字されています。
これらの文字やロゴはすべて完全に無視・除去してください。
文字が乗る前の背後にある『純粋な背景テクスチャ（和紙の質感、中央の水彩カラーシェイプ、蒔絵風の金箔散らし、光彩）』だけを完全再現・復元するためのプロンプト（文字なし、背景グラフィックのみ）を作成してください。` : `画像のスタイルを再現するプロンプトを作成してください。`}

JSONフォーマットのみを出力してください:
{
  "ja": "和紙の質感、中央に透明感のある翡翠色・深緑色の水彩シェイプ、蒔絵風の金箔散らし、文字配置用の中央クリーン構図、文字なし、最高峰コレクターズ品質",
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
      
      if (promptArea) promptArea.classList.remove('hidden');
      if (loadingInline) loadingInline.classList.add('hidden');
      if (resultArea) resultArea.classList.remove('hidden');

      showLoading(false);
      Logger.success('Vision AI プロンプト解析完了', parsed);
    } catch (err) {
      if (promptArea) promptArea.classList.remove('hidden');
      if (loadingInline) loadingInline.classList.add('hidden');
      showLoading(false);
      Logger.error('Vision AI 解析例外', err.message);
      alert('解析エラー: ' + err.message);
    }
  }

  // --- Gemini ネイティブ画像生成エンジン ---
  async function generateAiBackgroundRobust() {
    const apiKey = getEffectiveApiKey('image');
    if (!apiKey) {
      apiKeyModal.classList.remove('hidden');
      showAiStatus('有料スロットにAPIキーを入力してください。', 'error');
      alert('画像生成を行うために、右上の「API設定」のスロット2（有料キー）にAPIキーを入力してください。');
      return;
    }

    const prompt = (state.aiPrompt || '').trim();
    if (!prompt) {
      showAiStatus('プロンプトを作成してください。', 'error');
      return;
    }

    showLoading(true, '✨ Gemini 画像生成を実行中...');
    Logger.api('Gemini 画像生成開始', { prompt: prompt, keyMode: state.activeKeyMode });

    const candidateModels = [
      'gemini-3.1-flash-image',
      'gemini-3-pro-image',
      'nano-banana-pro-preview',
      'gemini-2.5-flash-image',
      'gemini-3.1-flash-image-preview',
      'gemini-3.1-flash-lite-image',
      'gemini-3.6-flash'
    ];

    let generatedImageUrl = null;
    let lastError = '';

    for (const model of candidateModels) {
      try {
        Logger.api(`試行中 [generateContent]: models/${model}`);
        showAiStatus(`モデル [${model}] で画像生成中...`, 'info');

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const payload = {
          contents: [{
            parts: [{
              text: `Generate a high resolution card background graphic image: ${prompt}. Clean layout for overlaying text, no typography.`
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
              generatedImageUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
              Logger.success(`🎉 generateContent 画像生成完全成功！ [${model}]`);
              break;
            } else if (part.text && part.text.includes('data:image')) {
              const match = part.text.match(/data:image\/[a-zA-Z]+;base64,[^"'\s\)]+/);
              if (match) {
                generatedImageUrl = match[0];
                Logger.success(`🎉 DataURL画像抽出成功！ [${model}]`);
                break;
              }
            }
          }

          if (generatedImageUrl) break;
        } else {
          const errJson = await resp.json().catch(() => ({}));
          lastError = errJson.error ? errJson.error.message : `HTTP ${resp.status}`;
          Logger.warn(`generateContent 失敗 [${model}]`, lastError);
        }
      } catch (e) {
        lastError = e.message;
        Logger.warn(`通信例外 [${model}]`, e.message);
      }
    }

    if (!generatedImageUrl) {
      for (const model of candidateModels) {
        try {
          Logger.api(`試行中 [predict]: models/${model}`);
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(apiKey)}`;
          const payload = {
            instances: [{ prompt: `${prompt}, master quality, luxury background texture, no typography` }],
            parameters: { sampleCount: 1, aspectRatio: state.aiAspectRatio }
          };

          const resp = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (resp.ok) {
            const data = await resp.json();
            const b64 = data.predictions?.[0]?.bytesBase64Encoded;
            if (b64) {
              generatedImageUrl = `data:image/jpeg;base64,${b64}`;
              Logger.success(`🎉 predict 画像生成完全成功！ [${model}]`);
              break;
            }
          }
        } catch (pe) {
          // ignore
        }
      }
    }

    if (generatedImageUrl) {
      state.bgType = 'image';
      state.bgImageSrc = generatedImageUrl;
      loadBackgroundImage(generatedImageUrl, () => {
        showLoading(false);
        showAiStatus('🎉 Gemini による背景画像の生成が完了しました！', 'success');
        document.querySelector('.tab-btn[data-tab="tab-card-edit"]').click();
      });
    } else {
      showLoading(false);
      showAiStatus(`画像生成エラー: ${lastError}`, 'error');
      Logger.error('画像生成失敗', lastError);
      alert(`Gemini 画像生成エラー:\n${lastError}\n\n※Web版Geminiで生成して画像をドラッグ＆ドロップして使用することも可能です。`);
    }
  }

  // --- 完成カード・アーカイブシステム (v3.0.0 超軽量圧縮保存) ---
  function saveCurrentToArchive() {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 320;
    thumbCanvas.height = Math.round(320 * (state.canvasHeight / state.canvasWidth));
    const tCtx = thumbCanvas.getContext('2d');
    tCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumbData = thumbCanvas.toDataURL('image/jpeg', 0.65);

    const archiveItem = {
      id: 'card_' + Date.now(),
      createdAt: new Date().toLocaleDateString('ja-JP'),
      title: `${state.brandText || 'CARD'} - ${state.kanjiText || ''} (${state.serialText || 'No-Serial'})`,
      ownerName: state.ownerName,
      sizeText: state.sizeText,
      thumbnail: thumbData,
      stateData: {
        aspectRatio: state.aspectRatio,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        brandText: state.brandText,
        brandRedInitial: state.brandRedInitial,
        kanjiText: state.kanjiText,
        kanjiFont: state.kanjiFont,
        romajiText: state.romajiText,
        romajiFont: state.romajiFont,
        ownerLabel: state.ownerLabel,
        ownerName: state.ownerName,
        serialText: state.serialText,
        sizeText: state.sizeText,
        extraInfoText: state.extraInfoText,
        verticalOffset: state.verticalOffset,
        bgType: state.bgType,
        bgImageSrc: state.bgImageSrc.startsWith('data:') ? thumbData : state.bgImageSrc
      }
    };

    state.cardArchive.unshift(archiveItem);
    saveState(true); // ☁️ Cloudflare KV へ自動アップロード
    renderArchiveGrid();
    Logger.success(`カード履歴に保存＆Cloudflare KV同期しました: ${archiveItem.title}`);
    alert(`「${archiveItem.title}」をカード履歴アルバムに保存しました！\n（※Cloudflare KV経由でiPhoneや相方様にも自動同期されます）`);
  }

  function renderArchiveGrid() {
    if (!archiveGrid) return;
    if (archiveCountTag) archiveCountTag.textContent = `${state.cardArchive.length} 件`;

    if (state.cardArchive.length === 0) {
      archiveGrid.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:12px;">
          保存されたカード履歴はまだありません。<br>
          「保存・出力」タブの「履歴アルバムに保存」を押すとここに蓄積されます。
        </div>
      `;
      return;
    }

    archiveGrid.innerHTML = state.cardArchive.map((item, idx) => `
      <div class="archive-card-item">
        <img src="${item.thumbnail}" class="archive-thumb" alt="thumb">
        <div class="archive-details">
          <div class="archive-title">${Logger.escapeHtml(item.title)}</div>
          <div class="archive-meta">
            オーナー: ${Logger.escapeHtml(item.ownerName || '未指定')} | サイズ: ${Logger.escapeHtml(item.sizeText || '')}<br>
            登録日: ${item.createdAt}
          </div>
        </div>
        <div class="archive-actions">
          <button type="button" class="btn-primary btn-sm" data-action="restore" data-idx="${idx}">復元・編集</button>
          <button type="button" class="btn-secondary btn-sm" data-action="delete" data-idx="${idx}" style="border-color:#ef5350; color:#ef5350;">削除</button>
        </div>
      </div>
    `).join('');

    archiveGrid.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const idx = parseInt(btn.dataset.idx, 10);
        const target = state.cardArchive[idx];
        if (!target) return;

        if (action === 'restore') {
          restoreFromArchive(target);
        } else if (action === 'delete') {
          if (confirm(`「${target.title}」を履歴から削除しますか？`)) {
            state.cardArchive.splice(idx, 1);
            saveState(true); // ☁️ Cloudflare KV へ自動アップロード
            renderArchiveGrid();
            Logger.info(`アーカイブ削除: ${target.title}`);
          }
        }
      });
    });
  }

  function restoreFromArchive(item) {
    Object.assign(state, item.stateData);
    syncInputsFromState();
    saveState(false);

    if (state.bgType === 'image' && state.bgImageSrc) {
      loadBackgroundImage(state.bgImageSrc, () => {
        renderCard();
      });
    } else {
      renderCard();
    }

    document.querySelector('.tab-btn[data-tab="tab-card-edit"]').click();
    Logger.success(`過去のカード「${item.title}」の設定を復元しました。`);
    alert(`「${item.title}」の設定を完全に復元しました！\n文字やシリアルNoを修正して再保存できます。`);
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
    reader.onload = (e) => {
      state.bgType = 'image';
      state.bgImageSrc = e.target.result;
      loadBackgroundImage(e.target.result);
      Logger.success(`手動画像を適用しました (${file.name})`);
    };
    reader.readAsDataURL(file);
  }

  function loadInitialBackground() {
    return new Promise((resolve) => {
      loadBackgroundImage(state.bgImageSrc, resolve);
    });
  }

  function loadBackgroundImage(src, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedBgImage = img;
      renderCard();
      if (callback) callback();
    };
    img.onerror = () => {
      state.bgType = 'preset_dark';
      renderCard();
      if (callback) callback();
    };
    img.src = src;
  }

  // --- レイヤー描画エンジン ---
  function renderCard() {
    if (isRendering) return;
    isRendering = true;

    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundLayer(ctx, canvas.width, canvas.height);
    drawTextLayer(ctx, canvas.width, canvas.height);

    isRendering = false;
  }

  function drawBackgroundLayer(targetCtx, w, h) {
    targetCtx.save();

    if (state.bgType === 'image' && loadedBgImage) {
      const img = loadedBgImage;
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
    } else if (state.bgType === 'preset_dark') {
      drawProceduralDarkGold(targetCtx, w, h);
    } else if (state.bgType === 'preset_ruby') {
      drawProceduralRubyWashi(targetCtx, w, h);
    }

    targetCtx.restore();
  }

  function drawProceduralDarkGold(targetCtx, w, h) {
    const grad = targetCtx.createRadialGradient(w/2, h/2, w*0.1, w/2, h/2, Math.max(w, h)*0.7);
    grad.addColorStop(0, '#1c1f26');
    grad.addColorStop(0.6, '#0f1115');
    grad.addColorStop(1, '#050608');
    targetCtx.fillStyle = grad;
    targetCtx.fillRect(0, 0, w, h);

    targetCtx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    targetCtx.lineWidth = Math.max(4, w * 0.004);
    targetCtx.strokeRect(w * 0.04, h * 0.03, w * 0.92, h * 0.94);
  }

  function drawProceduralRubyWashi(targetCtx, w, h) {
    const grad = targetCtx.createRadialGradient(w/2, h/2, w*0.1, w/2, h/2, Math.max(w, h)*0.7);
    grad.addColorStop(0, '#f2ece4');
    grad.addColorStop(0.6, '#ded3c3');
    grad.addColorStop(1, '#c2b39f');
    targetCtx.fillStyle = grad;
    targetCtx.fillRect(0, 0, w, h);

    const rubyGrad = targetCtx.createRadialGradient(w/2, h*0.48, 50, w/2, h*0.48, w*0.45);
    rubyGrad.addColorStop(0, 'rgba(139, 24, 27, 0.45)');
    rubyGrad.addColorStop(0.7, 'rgba(139, 24, 27, 0.25)');
    rubyGrad.addColorStop(1, 'rgba(139, 24, 27, 0)');
    targetCtx.fillStyle = rubyGrad;
    targetCtx.beginPath();
    targetCtx.ellipse(w/2, h*0.48, w*0.42, h*0.35, 0, 0, Math.PI * 2);
    targetCtx.fill();
  }

  function drawTextLayer(targetCtx, w, h) {
    targetCtx.save();
    const vOffset = (state.verticalOffset / 100) * (h * 0.1);

    if (state.brandText) {
      const brandY = h * 0.20 + vOffset;
      const brandFontSize = Math.round(w * 0.088);
      targetCtx.font = `700 ${brandFontSize}px ${state.romajiFont}`;
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';

      if (state.brandRedInitial && state.brandText.length > 1) {
        const initial = state.brandText.charAt(0);
        const rest = state.brandText.slice(1);
        const initialWidth = targetCtx.measureText(initial).width;
        const restWidth = targetCtx.measureText(rest).width;
        const totalWidth = initialWidth + restWidth;
        const startX = (w - totalWidth) / 2;

        drawRubyInitial(targetCtx, initial, startX + (initialWidth / 2), brandY, brandFontSize);
        drawGoldText(targetCtx, rest, startX + initialWidth + (restWidth / 2), brandY, brandFontSize, state.romajiFont);
      } else {
        drawGoldText(targetCtx, state.brandText, w / 2, brandY, brandFontSize, state.romajiFont);
      }
    }

    if (state.kanjiText) {
      const kanjiY = h * 0.44 + vOffset;
      const kanjiFontSize = Math.round(w * 0.28);
      targetCtx.font = `700 ${kanjiFontSize}px ${state.kanjiFont}`;
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      drawKanjiCharacter(targetCtx, state.kanjiText, w / 2, kanjiY, kanjiFontSize);
    }

    if (state.romajiText) {
      const romajiY = h * 0.68 + vOffset;
      const romajiFontSize = Math.round(w * 0.10);
      targetCtx.font = `800 ${romajiFontSize}px ${state.romajiFont}`;
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      drawGoldText(targetCtx, state.romajiText, w / 2, romajiY, romajiFontSize, state.romajiFont);
    }

    let currentY = h * 0.77 + vOffset;

    if (state.ownerName) {
      if (state.ownerLabel) {
        targetCtx.font = `600 ${Math.round(w * 0.046)}px 'Cinzel', serif`;
        targetCtx.fillStyle = '#222222';
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText(state.ownerLabel, w / 2, currentY);
        currentY += w * 0.052;
      }

      targetCtx.font = `700 ${Math.round(w * 0.062)}px 'Shippori Mincho', 'Noto Serif JP', serif`;
      targetCtx.fillStyle = '#111111';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(state.ownerName, w / 2, currentY);
      currentY += w * 0.060;
    }

    if (state.serialText) {
      targetCtx.font = `700 ${Math.round(w * 0.038)}px 'Montserrat', sans-serif`;
      targetCtx.fillStyle = '#2a2a2a';
      targetCtx.letterSpacing = '1px';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(state.serialText, w / 2, currentY);
      currentY += w * 0.052;
    }

    if (state.sizeText) {
      targetCtx.font = `800 ${Math.round(w * 0.058)}px 'Shippori Mincho', 'Noto Serif JP', serif`;
      targetCtx.fillStyle = '#111111';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(state.sizeText, w / 2, currentY);
      currentY += w * 0.050;
    }

    if (state.extraInfoText) {
      targetCtx.font = `600 ${Math.round(w * 0.032)}px 'Noto Serif JP', serif`;
      targetCtx.fillStyle = '#444444';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(state.extraInfoText, w / 2, currentY);
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

  function drawKanjiCharacter(targetCtx, char, x, y, size) {
    targetCtx.save();
    targetCtx.font = `700 ${size}px ${state.kanjiFont}`;
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
          drawTextLayer(offCtx, state.canvasWidth, state.canvasHeight);
          downloadCanvasAsPNG(offCanvas, `kuwagata_card_${state.kanjiText || 'cert'}_full.png`);
        } else if (type === 'bg') {
          drawBackgroundLayer(offCtx, state.canvasWidth, state.canvasHeight);
          downloadCanvasAsPNG(offCanvas, `kuwagata_bg_${state.aspectRatio.replace(':', '_')}.png`);
        } else if (type === 'text') {
          drawTextLayer(offCtx, state.canvasWidth, state.canvasHeight);
          downloadCanvasAsPNG(offCanvas, `kuwagata_text_layer.png`);
        }
        Logger.success(`PNG出力完了: ${type}`);
      } catch (err) {
        Logger.error('PNG出力例外', err.message);
        alert('保存エラーが発生しました。');
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

  function showAiStatus(msg, type) {
    if (!aiStatusMsg) return;
    aiStatusMsg.textContent = msg;
    aiStatusMsg.className = `ai-status-msg ${type}`;
  }

  window.addEventListener('DOMContentLoaded', init);
})();
