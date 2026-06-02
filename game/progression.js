/* ===== Fruit Slice — Full Progression System ===== */
(function() {
  'use strict';
  const SAVE_KEY = 'fs_progress';
  const DAILY_KEY = 'fs_daily_bonus';

  const UPGRADE_TIERS = {
    weapon: {
      name: 'Blade', icon: '🗡️', maxLevel: 5, baseCost: 1000, costMultiplier: 2, gemCost: 50,
      levels: [
        { level: 0, name: 'Butter Knife',     bonus: { sliceSize: 1, scoreMult: 1.0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Chef Knife',       bonus: { sliceSize: 1, scoreMult: 1.1 },   gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Katana',           bonus: { sliceSize: 2, scoreMult: 1.2 },   gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Laser Blade',      bonus: { sliceSize: 2, scoreMult: 1.35 },  gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Neon Saber',       bonus: { sliceSize: 3, scoreMult: 1.5 },   gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '⚡ Void Cutter',   bonus: { sliceSize: 4, scoreMult: 2.0 },   gemReq: 500, coinsReq: 20000 },
      ]
    },
    case: {
      name: 'Gauntlet', icon: '🧤', maxLevel: 5, baseCost: 800, costMultiplier: 2, gemCost: 50,
      levels: [
        { level: 0, name: 'Bare Hands',       bonus: { lives: 0, bombDeflect: 0 },       gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Leather Gloves',   bonus: { lives: 1, bombDeflect: 0 },       gemReq: 50,  coinsReq: 800 },
        { level: 2, name: 'Iron Gauntlets',   bonus: { lives: 1, bombDeflect: 0.1 },     gemReq: 80,  coinsReq: 1600 },
        { level: 3, name: 'Silver Mitts',     bonus: { lives: 2, bombDeflect: 0.15 },    gemReq: 120, coinsReq: 3200 },
        { level: 4, name: 'Golden Grips',     bonus: { lives: 2, bombDeflect: 0.2 },     gemReq: 200, coinsReq: 6400 },
        { level: 5, name: '💎 Diamond Claws', bonus: { lives: 3, bombDeflect: 0.3 },     gemReq: 500, coinsReq: 16000 },
      ]
    },
    outfit: {
      name: 'Belt', icon: '🔗', maxLevel: 5, baseCost: 600, costMultiplier: 2, gemCost: 40,
      levels: [
        { level: 0, name: 'Rope Belt',        bonus: { comboBonus: 0, fruitBonus: 0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Leather Belt',     bonus: { comboBonus: 5, fruitBonus: 0 },   gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Chain Belt',       bonus: { comboBonus: 10, fruitBonus: 1 },  gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Ninja Belt',       bonus: { comboBonus: 15, fruitBonus: 1 },  gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Samurai Obi',      bonus: { comboBonus: 25, fruitBonus: 2 },  gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🔥 Phoenix Sash',  bonus: { comboBonus: 40, fruitBonus: 3 },  gemReq: 350, coinsReq: 12000 },
      ]
    }
  };

  const PREMIUM_ITEMS = {
    legendarySkins: [
      { id: 'lg_void',       name: 'Void Blade',    desc: 'Dark matter slicing blade',        price: 4.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_cosmic',     name: 'Cosmic Cutter', desc: 'Galaxy-themed blade trail',         price: 6.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_flame',      name: 'Inferno Edge',  desc: 'Flaming blade effect',              price: 8.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
    ],
    premiumCases: [
      { id: 'pc_royal',      name: 'Royal Pass',     desc: '7 days: 2x coins + 50 gems/day',  price: 4.99,  gemPrice: 0,    type: 'subscription', duration: '7d' },
      { id: 'pc_vip',        name: 'VIP Status',     desc: '30 days: 3x coins + 100 gems/day',price: 12.99, gemPrice: 0,    type: 'subscription', duration: '30d' },
    ],
    bundles: [
      { id: 'bundle_starter',  name: 'Starter Bundle',   desc: '200 gems + 3 lives + exclusive trail',  price: 2.99,  gemPrice: 0,    type: 'one_time' },
      { id: 'bundle_mega',     name: 'Mega Power Pack',  desc: '500 gems + 10 lives + neon theme',       price: 7.99,  gemPrice: 0,    type: 'one_time' },
      { id: 'bundle_ultimate', name: 'Ultimate Bundle',  desc: '2000 gems + all themes + legendary blade', price: 19.99, gemPrice: 0, type: 'one_time' },
    ],
    removeAds: { id: 'remove_ads', name: 'Remove Ads', desc: 'Permanently remove all ads', price: 2.99, gemPrice: 0, type: 'one_time' },
  };

  const GEM_PACKS = [
    { id: 'gems_small',  name: 'Small Gem Pack',         gems: 100,  price: 0.99,  bonus: 0,    popular: false },
    { id: 'gems_medium', name: 'Standard Gem Pack',      gems: 500,  price: 3.99,  bonus: 50,   popular: true  },
    { id: 'gems_large',  name: 'Large Gem Pack',         gems: 1200, price: 7.99,  bonus: 200,  popular: false },
    { id: 'gems_mega',   name: 'Mega Gem Pack',          gems: 4000, price: 19.99, bonus: 1000, popular: false },
    { id: 'gems_ultra',  name: '🐳 Whale Pack',          gems: 10000,price: 39.99, bonus: 5000, popular: false },
  ];

  const CATALOG = {
    themes: [
      { id: 'default',   name: 'Dojo Dark',   price: 0,    desc: 'Classic ninja dojo',              colors: { bg: '#0f1020', accent: '#1a1a2e' } },
      { id: 'ninja',     name: 'Ninja Night',  price: 500,  desc: 'Stealth ninja theme',            colors: { bg: '#0a0a10', accent: '#1a0a1a' } },
      { id: 'candy',     name: 'Candy Land',   price: 800,  desc: 'Sweet candy colors',             colors: { bg: '#2a0a1a', accent: '#3a1525' } },
      { id: 'neon',      name: 'Neon Dojo',    price: 1000, desc: 'Bright neon on dark',            colors: { bg: '#1a0030', accent: '#2a0050' } },
      { id: 'samurai',   name: 'Samurai Dawn', price: 1500, desc: 'Traditional samurai theme',      colors: { bg: '#1a0a00', accent: '#2a1500' } },
      { id: 'ocean',     name: 'Ocean Splash', price: 2000, desc: 'Underwater slicing',            colors: { bg: '#001525', accent: '#002a40' } },
      { id: 'sunset',    name: 'Sunset Slice', price: 3000, desc: 'Warm sunset horizon',            colors: { bg: '#2d1b3d', accent: '#4a1a3a' } },
      { id: 'royal',     name: 'Royal Feast',  price: 5000, desc: 'Gold & royal purple feast',     colors: { bg: '#1a0030', accent: '#3a1050' } },
    ],
    pieceStyles: [
      { id: 'classic',    name: 'Classic Trail', price: 0,    desc: 'Standard slice trail',          borderRadius: 0, glow: false },
      { id: 'sparkle',    name: 'Sparkle Trail', price: 600,  desc: 'Sparkling slice effect',        borderRadius: 6, glow: false },
      { id: 'glow',       name: 'Glow Trail',    price: 1200, desc: 'Glowing slice line',           borderRadius: 3, glow: true },
      { id: 'rainbow',    name: 'Rainbow Trail', price: 2000, desc: 'Rainbow-colored slices',        borderRadius: 4, glow: true },
      { id: 'neon_edge',  name: 'Neon Trail',    price: 3500, desc: 'Neon-outlined slice path',     borderRadius: 2, glow: true },
    ],
    powerupPacks: [
      { id: 'starter',   name: 'Starter Pack',   price: 200,  items: { slowMo: 3, shield: 3 },         desc: '3 of each' },
      { id: 'slowmo',    name: 'Slow-Mo Pack',   price: 300,  items: { slowMo: 8 },                    desc: '8 slow-motion' },
      { id: 'shield',    name: 'Shield Pack',    price: 400,  items: { shield: 8 },                    desc: '8 shields' },
      { id: 'mega',      name: 'Mega Bundle',    price: 1000, items: { slowMo: 10, shield: 10 },        desc: '10 of each' },
    ],
    boosters: [
      { id: 'score_x2',   name: 'Score Booster',   price: 500,  desc: '2x score for next game',       effect: 'scoreMultiplier:2' },
      { id: 'fruit_rain', name: 'Fruit Rain',      price: 800,  desc: 'Double fruit spawn rate',      effect: 'fruitRain:1' },
      { id: 'bomb_shield',name: 'Bomb Shield',     price: 600,  desc: 'First bomb is harmless',       effect: 'bombShield:1' },
    ],
  };

  const ACHIEVEMENTS = [
    { id: 'first_play',      name: 'First Slice',      desc: 'Slice your first fruit',              reward: { coins: 50, gems: 0 },    icon: '🎮',  check: p => p.totalPlays >= 1 },
    { id: 'score_100',       name: 'Apple Picker',     desc: 'Score 100 in one game',               reward: { coins: 100, gems: 0 },   icon: '🍎',  check: p => p.bestScore >= 100 },
    { id: 'score_500',       name: 'Fruit Ninja',      desc: 'Score 500 in one game',               reward: { coins: 250, gems: 0 },   icon: '🥷',  check: p => p.bestScore >= 500 },
    { id: 'score_1000',      name: 'Samurai',          desc: 'Score 1000 in one game',              reward: { coins: 500, gems: 5 },   icon: '🗡️',  check: p => p.bestScore >= 1000 },
    { id: 'score_2000',      name: 'Blade Master',     desc: 'Score 2000 in one game',              reward: { coins: 1000, gems: 10 }, icon: '👑',  check: p => p.bestScore >= 2000 },
    { id: 'score_5000',      name: 'Grandmaster',      desc: 'Score 5000 in one game',              reward: { coins: 2000, gems: 25 }, icon: '🌟',  check: p => p.bestScore >= 5000 },
    { id: 'score_10000',     name: 'Legendary Blade',  desc: 'Score 10000 in one game',             reward: { coins: 5000, gems: 50 }, icon: '🏅',  check: p => p.bestScore >= 10000 },
    { id: 'combo_3',         name: 'Triple Threat',    desc: '3-hit combo streak',                  reward: { coins: 100, gems: 0 },   icon: '3️⃣',  check: p => p.bestCombo >= 3 },
    { id: 'combo_5',         name: 'Fruit Storm',      desc: '5-hit combo streak',                  reward: { coins: 200, gems: 5 },   icon: '5️⃣',  check: p => p.bestCombo >= 5 },
    { id: 'combo_10',        name: 'Blade Storm',      desc: '10-hit combo streak',                 reward: { coins: 500, gems: 10 },  icon: '💥',  check: p => p.bestCombo >= 10 },
    { id: 'combo_20',        name: 'Fruit Hurricane',  desc: '20-hit combo streak',                 reward: { coins: 1500, gems: 25 }, icon: '🌀',  check: p => p.bestCombo >= 20 },
    { id: 'combo_30',        name: 'Ultimate Storm',   desc: '30+ combo streak',                    reward: { coins: 3000, gems: 50 }, icon: '⚡',  check: p => p.bestCombo >= 30 },
    { id: 'fruits_100',      name: 'Fruit Collector',  desc: 'Slice 100 fruits total',              reward: { coins: 200, gems: 0 },   icon: '🍑',  check: p => p.totalFruits >= 100 },
    { id: 'fruits_500',      name: 'Fruit Hunter',     desc: 'Slice 500 fruits total',              reward: { coins: 600, gems: 10 },  icon: '🍇',  check: p => p.totalFruits >= 500 },
    { id: 'fruits_1000',     name: 'Fruit Legend',     desc: 'Slice 1000 fruits total',             reward: { coins: 1500, gems: 25 }, icon: '🍉',  check: p => p.totalFruits >= 1000 },
    { id: 'streak_3',        name: '3-Day Streak',     desc: 'Play 3 days in a row',                reward: { coins: 200, gems: 0 },   icon: '🔥',  check: p => p.bestStreak >= 3 },
    { id: 'streak_7',        name: 'Week Warrior',     desc: 'Play 7 days in a row',                reward: { coins: 500, gems: 10 },  icon: '📅',  check: p => p.bestStreak >= 7 },
    { id: 'streak_14',       name: 'Fortnight Champion',desc: 'Play 14 days in a row',              reward: { coins: 1500, gems: 25 }, icon: '⏰',  check: p => p.bestStreak >= 14 },
    { id: 'streak_30',       name: 'Month Master',     desc: 'Play 30 days in a row',               reward: { coins: 5000, gems: 100 },icon: '👑',  check: p => p.bestStreak >= 30 },
    { id: 'blade_1',         name: 'Sharpened',        desc: 'Upgrade blade to level 1',            reward: { coins: 200, gems: 0 },   icon: '🔪',  check: p => (p.upgrades?.weapon || 0) >= 1 },
    { id: 'blade_3',         name: 'Master Blade',     desc: 'Upgrade blade to level 3',            reward: { coins: 500, gems: 10 },  icon: '⚔️',  check: p => (p.upgrades?.weapon || 0) >= 3 },
    { id: 'blade_5',         name: 'Blade Legend',     desc: 'Reach max blade level',               reward: { coins: 2000, gems: 50 }, icon: '🗡️',  check: p => (p.upgrades?.weapon || 0) >= 5 },
    { id: 'gauntlet_1',      name: 'Gauntlet Up',      desc: 'Upgrade gauntlet to level 1',         reward: { coins: 200, gems: 0 },   icon: '🧤',  check: p => (p.upgrades?.case || 0) >= 1 },
    { id: 'gauntlet_3',      name: 'Iron Grip',        desc: 'Upgrade gauntlet to level 3',         reward: { coins: 500, gems: 10 },  icon: '💪',  check: p => (p.upgrades?.case || 0) >= 3 },
    { id: 'gauntlet_5',      name: 'Diamond Grip',     desc: 'Reach max gauntlet level',            reward: { coins: 2000, gems: 50 }, icon: '💎',  check: p => (p.upgrades?.case || 0) >= 5 },
    { id: 'belt_1',          name: 'Belt Up',          desc: 'Upgrade belt to level 1',             reward: { coins: 200, gems: 0 },   icon: '🔗',  check: p => (p.upgrades?.outfit || 0) >= 1 },
    { id: 'belt_3',          name: 'Champion Belt',    desc: 'Upgrade belt to level 3',             reward: { coins: 500, gems: 10 },  icon: '🏆',  check: p => (p.upgrades?.outfit || 0) >= 3 },
    { id: 'belt_5',          name: 'Belt Legend',      desc: 'Reach max belt level',                reward: { coins: 2000, gems: 50 }, icon: '👑',  check: p => (p.upgrades?.outfit || 0) >= 5 },
    { id: 'gems_100',        name: 'Gem Collector',    desc: 'Earn 100 total gems',                 reward: { coins: 500, gems: 20 },  icon: '💎',  check: p => p.totalGems >= 100 },
    { id: 'gems_500',        name: 'Gem Hoarder',      desc: 'Earn 500 total gems',                 reward: { coins: 1000, gems: 50 }, icon: '💠',  check: p => p.totalGems >= 500 },
    { id: 'all_achievements',name: 'Completionist',    desc: 'Unlock all other achievements',       reward: { coins: 10000, gems: 200 }, icon: '🏅', check: p => false },
  ];

  function defaultState() {
    return {
      coins: 100, gems: 0, totalGems: 0, xp: 0, level: 1,
      bestScore: 0, bestCombo: 0, totalFruits: 0, totalPlays: 0, bestStreak: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['default'], ownedPieceStyles: ['classic'],
      activeTheme: 'default', activePieceStyle: 'classic',
      powerups: { slowMo: 3, shield: 3 },
      activeBoosters: {}, inventory: {}, achievements: {}, lastSaveDate: null,
      adFree: false, subscriptions: {},
    };
  }

  let state = null;
  function save() { state.lastSaveDate = new Date().toISOString(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {} }
  function load() {
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { state = { ...defaultState(), ...JSON.parse(raw) }; if (!state.upgrades) state.upgrades = { weapon: 0, case: 0, outfit: 0 }; if (!state.gems && state.gems !== 0) state.gems = 0; if (!state.totalGems) state.totalGems = 0; if (!state.inventory) state.inventory = {}; if (!state.subscriptions) state.subscriptions = {}; if (!state.adFree) state.adFree = false; } } catch(e) {} reset(); return false; }
  function reset() { state = defaultState(); save(); }
  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl - 1)); }
  function addXp(amount) { if (!state) return; state.xp += amount; let leveled = false; while (state.xp >= xpForLevel(state.level)) { state.xp -= xpForLevel(state.level); state.level++; leveled = true; } save(); return leveled; }
  function addCoins(amount) { if (!state) return 0; state.coins += amount; save(); return state.coins; }
  function spendCoins(amount) { if (!state || state.coins < amount) return false; state.coins -= amount; save(); return true; }
  function addGems(amount) { if (!state) return 0; state.gems += amount; state.totalGems += amount; save(); return state.gems; }
  function spendGems(amount) { if (!state || state.gems < amount) return false; state.gems -= amount; save(); return true; }
  function getUpgradeCost(category, currentLevel) { const tier = UPGRADE_TIERS[category]; if (!tier) return null; const nextLevel = currentLevel + 1; const levelData = tier.levels.find(l => l.level === nextLevel); if (!levelData) return null; return { coins: levelData.coinsReq, gems: levelData.gemReq }; }
  function upgradeItem(category, useGems = false) { if (!state) return { success: false, reason: 'no_state' }; const tier = UPGRADE_TIERS[category]; if (!tier) return { success: false, reason: 'invalid_category' }; const current = state.upgrades[category] || 0; if (current >= tier.maxLevel) return { success: false, reason: 'max_level' }; const costs = getUpgradeCost(category, current); if (!costs) return { success: false, reason: 'no_level_data' }; if (useGems) { if (state.gems < costs.gems) return { success: false, reason: 'not_enough_gems' }; spendGems(costs.gems); } else { if (state.coins < costs.coins) return { success: false, reason: 'not_enough_coins' }; spendCoins(costs.coins); } state.upgrades[category]++; save(); return { success: true, newLevel: state.upgrades[category] }; }
  function getActiveBonuses() { if (!state) return { sliceSize: 1, scoreMult: 1, lives: 0, bombDeflect: 0, comboBonus: 0, fruitBonus: 0 }; const bonuses = { sliceSize: 1, scoreMult: 1, lives: 0, bombDeflect: 0, comboBonus: 0, fruitBonus: 0 }; const wLevel = state.upgrades.weapon || 0; const wData = UPGRADE_TIERS.weapon.levels[wLevel]; if (wData) { bonuses.sliceSize = wData.bonus.sliceSize; bonuses.scoreMult += (wData.bonus.scoreMult - 1); } const cLevel = state.upgrades.case || 0; const cData = UPGRADE_TIERS.case.levels[cLevel]; if (cData) { bonuses.lives = cData.bonus.lives; bonuses.bombDeflect = cData.bonus.bombDeflect; } const oLevel = state.upgrades.outfit || 0; const oData = UPGRADE_TIERS.outfit.levels[oLevel]; if (oData) { bonuses.comboBonus = oData.bonus.comboBonus; bonuses.fruitBonus = oData.bonus.fruitBonus; } return bonuses; }
  function ownsPremiumItem(itemId) { return state && state.inventory && state.inventory[itemId] === true; }
  function purchasePremiumItem(itemId) { if (!state) return false; state.inventory[itemId] = true;     if (itemId === 'remove_ads') {
      state.adFree = true;
      if (window.AdsManager) AdsManager.onAdsRemoved();
    } const bundleGems = { bundle_starter: 200, bundle_mega: 500, bundle_ultimate: 2000 }; if (bundleGems[itemId]) addGems(bundleGems[itemId]); save(); return true; }
  function checkAchievements() { if (!state) return []; const unlocked = []; for (const ach of ACHIEVEMENTS) { if (state.achievements[ach.id]) continue; if (ach.check(state)) { state.achievements[ach.id] = true; addCoins(ach.reward.coins); if (ach.reward.gems) addGems(ach.reward.gems); unlocked.push(ach); } } if (unlocked.length > 0) save(); return unlocked; }
  function claimDailyBonus() { if (!state) return null; const now = new Date(); const today = now.toDateString(); try { const lastClaim = localStorage.getItem(DAILY_KEY); if (lastClaim === today) return null; const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); const yesterdayStr = yesterday.toDateString(); let streak = 0; if (lastClaim === yesterdayStr) streak = (state.dailyStreak || 0) + 1; else streak = 1; state.dailyStreak = streak; if (streak > state.bestStreak) state.bestStreak = streak; const coins = Math.min(100 + (streak - 1) * 20, 1000); const gems = streak >= 7 ? 5 : streak >= 3 ? 2 : 0; addCoins(coins); if (gems) addGems(gems); localStorage.setItem(DAILY_KEY, today); save(); return { streak, coins, gems }; } catch(e) { return null; } }
  function endOfGame(result) { if (!state) return; state.totalPlays++; if (result.score > state.bestScore) state.bestScore = result.score; if (result.bestCombo > state.bestCombo) state.bestCombo = result.bestCombo; if (result.fruitsSliced) state.totalFruits += result.fruitsSliced; const xpGain = Math.floor(result.score / 10) + (result.fruitsSliced || 0) * 3 + 20; addXp(xpGain); const coinGain = Math.floor(result.score / 20) + (result.fruitsSliced || 0) + 5; addCoins(coinGain); save(); }
  function getState() { return state; }
  function getUpgradeTiers() { return UPGRADE_TIERS; }
  function getPremiumItems() { return PREMIUM_ITEMS; }
  function getGemPacks() { return GEM_PACKS; }
  function getCatalog() { return CATALOG; }
  function getAchievements() { return ACHIEVEMENTS; }
  function getCoinBalance() { return state ? state.coins : 0; }
  function getGemBalance() { return state ? state.gems : 0; }

  window.ProgressionSystem = {
    load, save, reset, addCoins, spendCoins, getCoinBalance, addGems, spendGems, getGemBalance,
    addXp, xpForLevel, upgradeItem, getUpgradeCost, getActiveBonuses, getUpgradeTiers, UPGRADE_TIERS,
    getPremiumItems, PREMIUM_ITEMS, getGemPacks, GEM_PACKS, ownsPremiumItem, purchasePremiumItem,
    getCatalog, CATALOG, getAchievements, ACHIEVEMENTS, checkAchievements, endOfGame, claimDailyBonus,
    getState, defaultState,
  };
})();
