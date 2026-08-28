import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import './web-fonts.css';

/*
 * خریدیار — یک نمونه‌ی کامل و آفلاین‌محور برای مدیریت خرید خانه.
 * همه‌ی قابلیت‌های اصلی این نسخه بدون وابستگی به پکیج‌های native کار می‌کنند
 * تا نسخه‌ی وب، Capacitor و APK یک رفتار یکسان داشته باشند.
 */

const FONT = 'Vazirmatn';
const STORAGE_KEY = 'kharidyar-state-v4';
const LEGACY_STORAGE_KEY = 'kharidyar-state-v3';

// Colors come from the shared NziCode flat design system (design-system.js)
// so this app and future NziCode apps stay visually consistent.
const THEME = {
  background: '#F3F3F8',
  surface: '#FFFFFF',
  ink: '#14151F',
  muted: '#71758A',
  faint: '#A6A9BB',
  primary: '#5B4FE9',
  primaryDark: '#4238C4',
  primarySoft: '#EEECFD',
  accent: '#FF6B54',
  success: '#1FAE7A',
  successSoft: '#E3F8EF',
  warning: '#E3A427',
  warningSoft: '#FDF3DE',
  danger: '#E5484D',
  dangerSoft: '#FCE8E8',
  line: '#E7E7EF',
  dark: '#1D1B2E',
  darkSoft: '#332F4E',
};

const DEFAULT_CATEGORIES = [
  { id: 'dairy', label: 'لبنیات', emoji: 'cheese' },
  { id: 'produce', label: 'میوه و سبزی', emoji: 'carrot' },
  { id: 'protein', label: 'پروتئینی', emoji: 'drumstick-bite' },
  { id: 'pantry', label: 'خواربار', emoji: 'wheat-awn' },
  { id: 'cleaning', label: 'شوینده', emoji: 'soap' },
  { id: 'snacks', label: 'تنقلات', emoji: 'cookie-bite' },
  { id: 'other', label: 'سایر', emoji: 'box' },
];

const NAV_ITEMS = [
  { id: 'home', label: 'خانه', icon: 'home' },
  { id: 'lists', label: 'لیست‌ها', icon: 'list' },
  { id: 'scanner', label: 'اسکنر', icon: 'scan' },
  { id: 'pantry', label: 'انبار', icon: 'pantry' },
  { id: 'profile', label: 'پروفایل', icon: 'profile' },
];

const SMART_SUGGESTIONS = [
  { id: 'breakfast', icon: 'sun', title: 'صبحانه‌ی این هفته', text: 'شیر، نان و تخم‌مرغ رو یادت نره.', items: ['شیر', 'نان', 'تخم‌مرغ'] },
  { id: 'fresh', icon: 'leaf', title: 'سبد تازه‌تر', text: 'چند میوه‌ی فصلی به سبدت اضافه کن.', items: ['سیب', 'موز'] },
  { id: 'save', icon: 'lightbulb', title: 'خرید اقتصادی', text: 'اقلام تکراری را یک‌جا و عمده بخر.', items: ['دستمال کاغذی'] },
];

const DEMO_SCAN_ITEMS = [
  { id: 'scan-milk', name: 'شیر کم‌چرب', emoji: 'cheese', category: 'dairy', confidence: 96, quantity: '۱ عدد' },
  { id: 'scan-apple', name: 'سیب قرمز', emoji: 'apple-whole', category: 'produce', confidence: 91, quantity: '۱ کیلو' },
  { id: 'scan-yogurt', name: 'ماست', emoji: 'bowl-rice', category: 'dairy', confidence: 87, quantity: '۱ عدد' },
];

const DEMO_PANTRY = [];

const safeJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readStorage = (key) => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return safeJson(globalThis.localStorage.getItem(key), null);
    }
  } catch {
    // Storage may be unavailable in private mode or a native shell.
  }
  return null;
};

const writeStorage = (key, value) => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // The app remains usable in-memory when storage is unavailable.
  }
};

const makeId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const toLatinDigits = (value) => String(value ?? '')
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

const normalizeItem = (item) => ({
  id: item.id || makeId('item'),
  name: item.name || item.title || 'کالای بدون نام',
  emoji: item.emoji || 'box',
  category: item.category || 'other',
  quantity: item.quantity || '۱',
  price: Number(item.price || item.estimatedPrice || 0),
  done: Boolean(item.done ?? item.completed),
  aisle: item.aisle || 'راهرو عمومی',
  createdAt: item.createdAt || Date.now(),
});

const normalizeList = (list, index) => ({
  id: list.id || makeId('list'),
  name: list.name || list.title || `لیست ${index + 1}`,
  emoji: list.emoji || list.icon || ['house', 'cart-shopping', 'champagne-glasses', 'wrench'][index % 4],
  members: Number(list.members || 1),
  updatedAt: list.updatedAt || Date.now(),
  items: Array.isArray(list.items) ? list.items.map(normalizeItem) : [],
});

const createEmptyState = () => ({
  version: 4,
  onboardingDone: false,
  userName: '',
  language: 'fa',
  currency: 'تومان',
  diet: 'بدون محدودیت',
  notifications: true,
  offline: true,
  lists: [{ id: 'home', name: 'خرید خانه', emoji: 'house', members: 1, updatedAt: Date.now(), items: [] }],
  categories: DEFAULT_CATEGORIES,
  pantry: DEMO_PANTRY,
  receipts: [],
  history: [],
  family: {
    members: [{ id: 'me', name: 'شما', role: 'مدیر', points: 0, emoji: 'user' }],
    comments: [],
  },
});

const normalizeState = (saved) => {
  const fallback = createEmptyState();
  if (!saved || typeof saved !== 'object') return fallback;
  const oldLists = Array.isArray(saved.lists) ? saved.lists : [];
  const lists = oldLists.length ? oldLists.map(normalizeList) : fallback.lists;
  const categories = Array.isArray(saved.categories) && saved.categories.length
    ? saved.categories.filter((category) => category.id !== 'all').map((category) => ({
      id: category.id || makeId('cat'),
      label: category.label || category.name || 'سایر',
      emoji: category.emoji || 'box',
    }))
    : fallback.categories;
  return {
    ...fallback,
    ...saved,
    version: 4,
    onboardingDone: Boolean(saved.onboardingDone || saved.userName || saved.name),
    userName: saved.userName || saved.name || '',
    currency: saved.currency || 'تومان',
    diet: saved.diet || 'بدون محدودیت',
    lists,
    categories,
    pantry: Array.isArray(saved.pantry) ? saved.pantry : [],
    receipts: Array.isArray(saved.receipts) ? saved.receipts : [],
    history: Array.isArray(saved.history) ? saved.history : [],
    family: saved.family || fallback.family,
  };
};

const loadInitialState = () => {
  const current = readStorage(STORAGE_KEY);
  if (current) {
    if (current.version === 4) return normalizeState(current);
    return normalizeState({
      ...current,
      lists: Array.isArray(current.lists)
        ? current.lists.map((list) => ({ ...list, items: [] }))
        : undefined,
      pantry: [],
      receipts: [],
      history: [],
    });
  }
  const legacy = readStorage(LEGACY_STORAGE_KEY);
  if (legacy) {
    // داده‌های نسخه‌ی قدیمی فقط برای نام و تنظیمات مهاجرت می‌شوند؛
    // اقلام نمونه‌ی قبلی عمداً وارد نسخه‌ی جدید نمی‌شوند.
    return normalizeState({
      ...legacy,
      lists: Array.isArray(legacy.lists)
        ? legacy.lists.map((list) => ({ ...list, items: [] }))
        : undefined,
    });
  }
  return createEmptyState();
};

const formatMoney = (value, currency) => {
  const number = Number(value || 0);
  return `${number.toLocaleString('fa-IR')} ${currency}`;
};

const getCategory = (categories, id) => categories.find((category) => category.id === id) || categories[categories.length - 1] || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];

const Icon = ({ name, size = 21, color = THEME.ink }) => {
  // Central icon registry — FontAwesome6 names, used everywhere instead of
  // unicode glyphs/emoji for crisp, consistent vector icons across the app.
  const names = {
    menu: 'bars',
    back: 'chevron-right', // points right: RTL "back" reads toward the start (right)
    home: 'house',
    list: 'list-ul',
    scan: 'camera-retro',
    pantry: 'box-archive',
    profile: 'user',
    plus: 'plus',
    search: 'magnifying-glass',
    share: 'share-nodes',
    more: 'ellipsis',
    check: 'check',
    close: 'xmark',
    mic: 'microphone',
    camera: 'camera',
    barcode: 'barcode',
    receipt: 'receipt',
    cart: 'cart-shopping',
    settings: 'gear',
    users: 'users',
    clock: 'clock',
    arrow: 'chevron-left', // points left: RTL "forward" reads toward the end (left)
    spark: 'wand-magic-sparkles',
    chevron: 'chevron-left',
    trash: 'trash',
    edit: 'pen',
    bell: 'bell',
    cloud: 'cloud',
    route: 'route',
    trophy: 'trophy',
  };
  return <FontAwesome6 name={names[name] || 'circle'} size={size * 0.86} color={color} />;
};

// Renders a data-driven icon (used for category/list/pantry/item icons that
// used to be free-form emoji). Accepts a FontAwesome6 icon name; falls back
// to rendering literal text so any old saved emoji data still displays.
const Glyph = ({ value, size = 20, color = THEME.ink, style }) => {
  if (typeof value === 'string' && /^[a-z0-9-]+$/.test(value)) {
    return <FontAwesome6 name={value} size={size} color={color} style={style} />;
  }
  return <Text style={[{ fontSize: size }, style]}>{value}</Text>;
};

const Button = ({ children, onPress, variant = 'primary', icon, style, disabled = false }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.button,
      variant === 'secondary' && styles.buttonSecondary,
      variant === 'ghost' && styles.buttonGhost,
      variant === 'danger' && styles.buttonDanger,
      disabled && styles.buttonDisabled,
      pressed && styles.pressed,
      style,
    ]}
  >
    {icon ? <Icon name={icon} size={19} color={variant === 'primary' ? '#fff' : variant === 'danger' ? THEME.danger : THEME.primary} /> : null}
    <Text style={[styles.buttonText, variant !== 'primary' && styles.buttonTextDark]}>{children}</Text>
  </Pressable>
);

const Pill = ({ children, active = false, onPress, emoji, style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed, style]}
  >
    {emoji ? <Glyph value={emoji} size={14} color={active ? "#fff" : THEME.primary} style={styles.pillEmoji} /> : null}
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text>
  </Pressable>
);

const SectionTitle = ({ title, action, onAction }) => (
  <View style={styles.sectionTitleRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action ? <Pressable onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text><Icon name="chevron" size={17} color={THEME.primary} /></Pressable> : null}
  </View>
);

const ProgressBar = ({ value, color = THEME.primary }) => (
  <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} /></View>
);

const ScreenHeader = ({ title, subtitle, onBack, right, dark = false }) => (
  <View style={[styles.screenHeader, dark && styles.screenHeaderDark]}>
    <View style={styles.headerLeading}>
      {onBack ? <Pressable onPress={onBack} style={styles.iconButton}><Icon name="back" size={30} color={dark ? '#fff' : THEME.ink} /></Pressable> : null}
      <View>
        <Text style={[styles.screenTitle, dark && styles.screenTitleDark]}>{title}</Text>
        {subtitle ? <Text style={[styles.screenSubtitle, dark && styles.screenSubtitleDark]}>{subtitle}</Text> : null}
      </View>
    </View>
    {right || null}
  </View>
);

const ModalShell = ({ visible, onClose, title, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalTitleRow}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}><Icon name="close" size={24} color={THEME.muted} /></Pressable>
        </View>
        {children}
      </View>
    </View>
  </Modal>
);

const EmptyState = ({ icon = 'cart-shopping', title, text, action, onAction }) => (
  <View style={styles.emptyState}>
    <Glyph value={icon} size={34} color={THEME.faint} style={styles.emptyIcon} />
    <Text style={styles.emptyTitle}>{title}</Text>
    {text ? <Text style={styles.emptyText}>{text}</Text> : null}
    {action ? <Button onPress={onAction} icon="plus">{action}</Button> : null}
  </View>
);

const App = () => {
  const [hydrated, setHydrated] = useState(false);
  const [setup, setSetup] = useState({
    onboardingDone: false,
    userName: '',
    language: 'fa',
    currency: 'تومان',
    diet: 'بدون محدودیت',
    notifications: true,
    offline: true,
  });
  const [lists, setLists] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [pantry, setPantry] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [history, setHistory] = useState([]);
  const [family, setFamily] = useState(createEmptyState().family);
  const [view, setView] = useState('home');
  const [activeListId, setActiveListId] = useState('home');
  const [modal, setModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [itemDraft, setItemDraft] = useState({ name: '', quantity: '۱', price: '', category: 'dairy' });
  const [entryTab, setEntryTab] = useState('manual');
  const [entryMessage, setEntryMessage] = useState('');
  const [newListDraft, setNewListDraft] = useState({ name: '', emoji: 'cart-shopping' });
  const [newCategoryDraft, setNewCategoryDraft] = useState({ label: '', emoji: 'box' });
  const [pantryDraft, setPantryDraft] = useState({ name: '', quantity: '۱ عدد', expiry: '۷', emoji: 'box' });
  const [receiptScanning, setReceiptScanning] = useState(false);
  const [scannerCaptured, setScannerCaptured] = useState(false);
  const [scannerItems, setScannerItems] = useState([]);
  const [shoppingIndex, setShoppingIndex] = useState(0);
  const [onboardingAuth, setOnboardingAuth] = useState('skip');
  const [inviteDraft, setInviteDraft] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [onboardingDraft, setOnboardingDraft] = useState({ name: '', language: 'fa', currency: 'تومان', diet: 'بدون محدودیت' });

  useEffect(() => {
    const saved = loadInitialState();
    setSetup({
      onboardingDone: saved.onboardingDone,
      userName: saved.userName,
      language: saved.language,
      currency: saved.currency,
      diet: saved.diet,
      notifications: saved.notifications !== false,
      offline: saved.offline !== false,
    });
    setLists(saved.lists);
    setCategories(saved.categories);
    setPantry(saved.pantry);
    setReceipts(saved.receipts);
    setHistory(saved.history);
    setFamily(saved.family);
    setOnboardingDraft({
      name: saved.userName || '',
      language: saved.language || 'fa',
      currency: saved.currency || 'تومان',
      diet: saved.diet || 'بدون محدودیت',
    });
    if (saved.lists[0]) setActiveListId(saved.lists[0].id);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(STORAGE_KEY, {
      version: 4,
      ...setup,
      lists,
      categories,
      pantry,
      receipts,
      history,
      family,
    });
  }, [hydrated, setup, lists, categories, pantry, receipts, history, family]);

  const activeList = useMemo(() => lists.find((list) => list.id === activeListId) || lists[0], [lists, activeListId]);
  const activeItems = activeList?.items || [];
  const openItems = activeItems.filter((item) => !item.done);
  const completedItems = activeItems.filter((item) => item.done);
  const estimatedTotal = activeItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const completedTotal = activeItems.filter((item) => item.done).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const completion = activeItems.length ? Math.round((completedItems.length / activeItems.length) * 100) : 0;

  const navigate = (nextView) => {
    setMenuOpen(false);
    setModal(null);
    setView(nextView);
    if (nextView !== 'detail') setFilter('all');
  };

  const saveOnboarding = () => {
    const name = onboardingDraft.name.trim() || 'دوست خریدیار';
    setSetup((current) => ({ ...current, ...onboardingDraft, userName: name, onboardingDone: true }));
    setOnboardingDraft((current) => ({ ...current, name }));
    if (!lists.length) setLists(createEmptyState().lists);
    navigate('home');
  };

  const updateActiveList = (updater) => {
    setLists((current) => current.map((list) => list.id === activeListId ? updater(list) : list));
  };

  const addItem = (override = {}) => {
    const name = String(override.name ?? itemDraft.name).trim();
    if (!name) {
      setEntryMessage('نام کالا را وارد کن.');
      return;
    }
    const category = override.category || itemDraft.category || 'other';
    const categoryInfo = getCategory(categories, category);
    const item = normalizeItem({
      id: makeId('item'),
      name,
      emoji: override.emoji || categoryInfo.emoji,
      category,
      quantity: override.quantity || itemDraft.quantity || '۱',
      price: Number(toLatinDigits(override.price ?? itemDraft.price).replace(/[^\d.]/g, '')) || 0,
      aisle: override.aisle || 'راهرو عمومی',
      done: false,
    });
    updateActiveList((list) => ({ ...list, updatedAt: Date.now(), items: [...list.items, item] }));
    setItemDraft({ name: '', quantity: '۱', price: '', category: 'dairy' });
    setEntryMessage('');
    setModal(null);
  };

  const toggleItem = (itemId) => {
    updateActiveList((list) => {
      const target = list.items.find((item) => item.id === itemId);
      if (!target) return list;
      const rest = list.items.filter((item) => item.id !== itemId);
      return { ...list, updatedAt: Date.now(), items: [...rest, { ...target, done: !target.done }] };
    });
  };

  const removeItem = (itemId) => updateActiveList((list) => ({ ...list, items: list.items.filter((item) => item.id !== itemId) }));

  const createList = () => {
    const name = newListDraft.name.trim();
    if (!name) return;
    const list = { id: makeId('list'), name, emoji: newListDraft.emoji || 'cart-shopping', members: 1, updatedAt: Date.now(), items: [] };
    setLists((current) => [list, ...current]);
    setActiveListId(list.id);
    setNewListDraft({ name: '', emoji: 'cart-shopping' });
    setModal(null);
    setView('detail');
  };

  const archiveActiveList = () => {
    if (!activeList || !activeItems.length) {
      setModal(null);
      return;
    }
    setHistory((current) => [{
      id: makeId('history'),
      listName: activeList.name,
      date: new Date().toLocaleDateString('fa-IR'),
      count: activeItems.length,
      total: estimatedTotal,
    }, ...current]);
    updateActiveList((list) => ({ ...list, items: [] }));
    setModal(null);
    setView('home');
  };

  const shareActiveList = async () => {
    const text = `${activeList?.name || 'لیست خرید'}\n${activeItems.map((item) => `• ${item.name} (${item.quantity})`).join('\n') || 'هنوز کالایی اضافه نشده است.'}`;
    try {
      if (Platform.OS !== 'web' && Share?.share) {
        await Share.share({ message: text });
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: activeList?.name || 'خریدیار', text });
      } else {
        Alert.alert('اشتراک‌گذاری لیست', text);
      }
    } catch {
      // Cancelled by user.
    }
  };

  const simulateEntry = (type) => {
    if (type === 'voice') {
      setItemDraft((current) => ({ ...current, name: 'شیر کم‌چرب' }));
      setEntryMessage('صدای شما به‌صورت نمایشی به «شیر کم‌چرب» تبدیل شد.');
    } else if (type === 'photo') {
      setItemDraft((current) => ({ ...current, name: 'سیب قرمز', category: 'produce' }));
      setEntryMessage('از تصویر، «سیب قرمز» تشخیص داده شد.');
    } else if (type === 'barcode') {
      setItemDraft((current) => ({ ...current, name: 'ماست کم‌چرب', category: 'dairy' }));
      setEntryMessage('بارکد ۶۲۶۰۱۲۳۴۵۶۷۸۹ شناسایی شد.');
    }
  };

  const captureScanner = () => {
    setScannerCaptured(true);
    setScannerItems(DEMO_SCAN_ITEMS.map((item) => ({ ...item, selected: true })));
  };

  const addScannerItem = (item) => {
    updateActiveList((list) => ({
      ...list,
      items: [...list.items, normalizeItem({
        name: item.name,
        emoji: item.emoji,
        category: item.category,
        quantity: item.quantity,
        price: 0,
      })],
      updatedAt: Date.now(),
    }));
    setScannerItems((current) => current.filter((candidate) => candidate.id !== item.id));
  };

  const addPantryItem = () => {
    if (!pantryDraft.name.trim()) return;
    setPantry((current) => [{
      id: makeId('pantry'),
      name: pantryDraft.name.trim(),
      quantity: pantryDraft.quantity || '۱ عدد',
      expiry: Number(toLatinDigits(pantryDraft.expiry)) || 0,
      emoji: pantryDraft.emoji || 'box',
    }, ...current]);
    setPantryDraft({ name: '', quantity: '۱ عدد', expiry: '۷', emoji: 'box' });
    setModal(null);
  };

  const addPantryToList = (pantryItem) => {
    updateActiveList((list) => ({
      ...list,
      updatedAt: Date.now(),
      items: [...list.items, normalizeItem({ name: pantryItem.name, emoji: pantryItem.emoji, quantity: pantryItem.quantity, category: 'other' })],
    }));
    setPantry((current) => current.filter((item) => item.id !== pantryItem.id));
    setView('detail');
  };

  const scanReceipt = () => {
    setReceiptScanning(true);
    setTimeout(() => {
      setReceiptScanning(false);
      setReceipts((current) => [{
        id: makeId('receipt'),
        store: 'فروشگاه نمونه',
        date: new Date().toLocaleDateString('fa-IR'),
        total: 485000,
        count: 8,
      }, ...current]);
    }, 700);
  };

  const addCategory = () => {
    if (!newCategoryDraft.label.trim()) return;
    setCategories((current) => [...current, { id: makeId('cat'), label: newCategoryDraft.label.trim(), emoji: newCategoryDraft.emoji || 'box' }]);
    setNewCategoryDraft({ label: '', emoji: 'box' });
    setModal(null);
  };

  const removeCategory = (categoryId) => {
    if (categories.length <= 1) return;
    setCategories((current) => current.filter((category) => category.id !== categoryId));
    setLists((current) => current.map((list) => ({
      ...list,
      items: list.items.map((item) => item.category === categoryId ? { ...item, category: 'other' } : item),
    })));
  };

  const resetData = () => {
    const perform = () => {
      const fresh = createEmptyState();
      setSetup({
        onboardingDone: false,
        userName: '',
        language: 'fa',
        currency: 'تومان',
        diet: 'بدون محدودیت',
        notifications: true,
        offline: true,
      });
      setLists(fresh.lists);
      setCategories(fresh.categories);
      setPantry([]);
      setReceipts([]);
      setHistory([]);
      setFamily(fresh.family);
      setOnboardingDraft({ name: '', language: 'fa', currency: 'تومان', diet: 'بدون محدودیت' });
      setModal(null);
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('همه‌ی داده‌های محلی پاک شود؟')) perform();
    } else {
      Alert.alert('پاک‌کردن داده‌ها', 'همه‌ی اطلاعات محلی پاک شود؟', [{ text: 'انصراف', style: 'cancel' }, { text: 'پاک کن', style: 'destructive', onPress: perform }]);
    }
  };

  const openContact = (kind) => {
    const links = {
      whatsapp: 'https://wa.me/989198433408',
      telegram: 'https://t.me/NziCode',
      email: 'mailto:nazari.moradkhani@gmail.com',
    };
    const url = links[kind];
    if (url) Linking.openURL(url).catch(() => Alert.alert('ارتباط با NziCode', url));
  };

  const addComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    setFamily((current) => ({
      ...current,
      comments: [{
        id: makeId('comment'),
        name: setup.userName || 'شما',
        text,
        date: 'همین حالا',
        emoji: 'user',
      }, ...(current.comments || [])],
    }));
    setCommentDraft('');
  };

  const exportBackup = async () => {
    const backup = JSON.stringify({
      exportedAt: new Date().toISOString(),
      app: 'خریدیار',
      setup,
      lists,
      categories,
      pantry,
      receipts,
      history,
      family,
    }, null, 2);
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([backup], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'KharidYar-backup.json';
        anchor.click();
        URL.revokeObjectURL(url);
        Alert.alert('پشتیبان‌گیری', 'فایل پشتیبان دانلود شد.');
      } else if (Share?.share) {
        await Share.share({ title: 'پشتیبان خریدیار', message: backup });
      }
    } catch {
      Alert.alert('پشتیبان‌گیری', 'ساخت فایل پشتیبان انجام نشد؛ دوباره تلاش کن.');
    }
  };

  const filteredItems = useMemo(() => activeItems.filter((item) => {
    const categoryMatch = filter === 'all' || item.category === filter;
    const searchMatch = !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase());
    return categoryMatch && searchMatch;
  }), [activeItems, filter, search]);

  const groupedItems = useMemo(() => {
    const groups = [];
    categories.forEach((category) => {
      const items = filteredItems.filter((item) => item.category === category.id);
      if (items.length) groups.push({ ...category, items });
    });
    const uncategorized = filteredItems.filter((item) => !categories.some((category) => category.id === item.category));
    if (uncategorized.length) groups.push({ id: 'other', label: 'سایر', emoji: 'box', items: uncategorized });
    return groups;
  }, [categories, filteredItems]);

  if (!hydrated) {
    return <SafeAreaView style={styles.loading}><StatusBar barStyle="dark-content" /><Glyph value="cart-shopping" size={44} color={THEME.primary} style={styles.loadingLogo} /><Text style={styles.loadingText}>خریدیار در حال آماده‌سازی است…</Text></SafeAreaView>;
  }

  if (!setup.onboardingDone) {
    return (
      <SafeAreaView style={styles.appShell}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.onboarding}>
          <View style={styles.brandMark}><Icon name="cart" size={34} color="#fff" /></View>
          <Text style={styles.brandName}>خریدیار</Text>
          <Text style={styles.brandTagline}>خریدهای روزمره، ساده‌تر و هوشمندتر</Text>
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>خوش آمدی</Text>
            <Text style={styles.onboardingText}>برای شروع چند تنظیم کوچک را انتخاب کن.</Text>
            <Text style={styles.fieldLabel}>اسمت را چطور صدا بزنیم؟</Text>
            <TextInput
              value={onboardingDraft.name}
              onChangeText={(name) => setOnboardingDraft((current) => ({ ...current, name }))}
              placeholder="مثلاً محمد علی"
              placeholderTextColor={THEME.faint}
              style={styles.input}
              textAlign="right"
            />
            <Text style={styles.fieldLabel}>ورود (اختیاری)</Text>
            <View style={styles.authRow}>
              <Pressable onPress={() => setOnboardingAuth('phone')} style={[styles.authButton, onboardingAuth === 'phone' && styles.authButtonActive]}>
                <Glyph value="mobile-screen" size={17} color={THEME.primary} style={styles.authEmoji} />
                <Text style={[styles.authButtonText, onboardingAuth === 'phone' && styles.authButtonTextActive]}>شماره موبایل</Text>
              </Pressable>
              <Pressable onPress={() => setOnboardingAuth('google')} style={[styles.authButton, onboardingAuth === 'google' && styles.authButtonActive]}>
                <Text style={styles.authEmoji}>G</Text>
                <Text style={[styles.authButtonText, onboardingAuth === 'google' && styles.authButtonTextActive]}>حساب Google</Text>
              </Pressable>
              <Pressable onPress={() => setOnboardingAuth('skip')} style={[styles.authButton, onboardingAuth === 'skip' && styles.authButtonActive]}>
                <Icon name="arrow" size={16} color={THEME.primary} />
                <Text style={[styles.authButtonText, onboardingAuth === 'skip' && styles.authButtonTextActive]}>رد کردن</Text>
              </Pressable>
            </View>
            <Text style={styles.optionalHint}>ورود برای همگام‌سازی بین دستگاه‌هاست؛ بدون آن هم برنامه آفلاین کار می‌کند.</Text>
            <Text style={styles.fieldLabel}>زبان برنامه</Text>
            <View style={styles.choiceRow}>
              {['فارسی', 'English'].map((label, index) => {
                const value = index === 0 ? 'fa' : 'en';
                return <Pill key={value} active={onboardingDraft.language === value} onPress={() => setOnboardingDraft((current) => ({ ...current, language: value }))}>{label}</Pill>;
              })}
            </View>
            <Text style={styles.fieldLabel}>واحد پول</Text>
            <View style={styles.choiceRow}>
              {['تومان', 'ریال', 'دلار'].map((currency) => <Pill key={currency} active={onboardingDraft.currency === currency} onPress={() => setOnboardingDraft((current) => ({ ...current, currency }))}>{currency}</Pill>)}
            </View>
            <Text style={styles.fieldLabel}>حالت غذایی (اختیاری)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChoices}>
              {['بدون محدودیت', 'گیاه‌خواری', 'کم‌قند', 'ورزشی'].map((diet) => <Pill key={diet} active={onboardingDraft.diet === diet} onPress={() => setOnboardingDraft((current) => ({ ...current, diet }))}>{diet}</Pill>)}
            </ScrollView>
            <Text style={styles.fieldLabel}>دعوت اعضای خانواده (اختیاری)</Text>
            <View style={styles.inviteRow}>
              <TextInput value={inviteDraft} onChangeText={setInviteDraft} placeholder="شماره یا ایمیل عضو خانواده" placeholderTextColor={THEME.faint} style={styles.inviteInput} textAlign="right" />
              <Pressable onPress={() => {
                if (inviteDraft.trim()) {
                  setFamily((current) => ({
                    ...current,
                    members: [...(current.members || []), { id: makeId('member'), name: inviteDraft.trim(), role: 'دعوت‌شده', points: 0, emoji: 'envelope' }],
                  }));
                  setInviteMessage('دعوت ثبت شد؛ بعد از ورود عضو برای او ارسال می‌شود.');
                  setInviteDraft('');
                }
              }} style={styles.inviteButton}><Icon name="users" size={18} color={THEME.primary} /><Text style={styles.inviteButtonText}>دعوت</Text></Pressable>
            </View>
            {inviteMessage ? <Text style={styles.optionalHint}>{inviteMessage}</Text> : null}
            <Button onPress={saveOnboarding} icon="arrow" style={styles.continueButton}>شروع کنیم</Button>
            <Pressable onPress={saveOnboarding} style={styles.skipButton}><Text style={styles.skipText}>فعلاً رد می‌کنم</Text></Pressable>
          </View>
          <Text style={styles.onboardingFoot}>ساخته‌شده با ❤ توسط NziCode</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderMenuModal = () => (
    <ModalShell visible={menuOpen} onClose={() => setMenuOpen(false)} title="منوی خریدیار">
      <View style={styles.menuGrid}>
        {[
          ['lists', 'لیست‌های من', 'list'],
          ['scanner', 'اسکن یخچال', 'scan'],
          ['pantry', 'انبار خانه', 'pantry'],
          ['receipts', 'رسیدها و هزینه‌ها', 'receipt'],
          ['family', 'خانواده و امتیازها', 'users'],
          ['profile', 'تنظیمات', 'settings'],
        ].map(([id, label, icon]) => (
          <Pressable key={id} onPress={() => navigate(id)} style={styles.menuItem}>
            <View style={styles.menuIcon}><Icon name={icon} size={23} color={THEME.primary} /></View>
            <Text style={styles.menuItemText}>{label}</Text>
            <Icon name="chevron" size={18} color={THEME.faint} />
          </Pressable>
        ))}
        <Pressable onPress={() => { setMenuOpen(false); setModal('categories'); }} style={styles.menuItem}>
          <View style={styles.menuIcon}><Icon name="edit" size={21} color={THEME.primary} /></View>
          <Text style={styles.menuItemText}>مدیریت دسته‌بندی‌ها</Text>
          <Icon name="chevron" size={18} color={THEME.faint} />
        </Pressable>
      </View>
    </ModalShell>
  );

  const renderAddItemModal = () => (
    <ModalShell visible={modal === 'addItem'} onClose={() => setModal(null)} title="افزودن کالا">
      <View style={styles.entryTabs}>
        {[
          ['manual', 'دستی', 'edit'],
          ['voice', 'صدا', 'mic'],
          ['photo', 'عکس', 'camera'],
          ['barcode', 'بارکد', 'barcode'],
        ].map(([id, label, icon]) => (
          <Pressable key={id} onPress={() => { setEntryTab(id); setEntryMessage(''); }} style={[styles.entryTab, entryTab === id && styles.entryTabActive]}>
            <Icon name={icon} size={20} color={entryTab === id ? THEME.primary : THEME.muted} />
            <Text style={[styles.entryTabText, entryTab === id && styles.entryTabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {entryTab === 'manual' ? (
        <>
          <TextInput value={itemDraft.name} onChangeText={(name) => setItemDraft((current) => ({ ...current, name }))} placeholder="نام کالا، مثلاً نان سنگک" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" autoFocus />
          <View style={styles.formRow}>
            <TextInput value={itemDraft.quantity} onChangeText={(quantity) => setItemDraft((current) => ({ ...current, quantity }))} placeholder="تعداد" placeholderTextColor={THEME.faint} style={[styles.input, styles.smallInput]} textAlign="right" />
            <TextInput value={itemDraft.price} onChangeText={(price) => setItemDraft((current) => ({ ...current, price }))} placeholder="قیمت تقریبی" placeholderTextColor={THEME.faint} keyboardType="numeric" style={[styles.input, styles.priceInput]} textAlign="right" />
          </View>
          <Text style={styles.fieldLabel}>دسته‌بندی پیشنهادی</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChoices}>
            {categories.map((category) => <Pill key={category.id} active={itemDraft.category === category.id} onPress={() => setItemDraft((current) => ({ ...current, category: category.id }))} emoji={category.emoji}>{category.label}</Pill>)}
          </ScrollView>
        </>
      ) : (
        <View style={styles.capturePanel}>
          <View style={styles.captureIcon}><Icon name={entryTab === 'voice' ? 'mic' : entryTab === 'photo' ? 'camera' : 'barcode'} size={38} color={THEME.primary} /></View>
          <Text style={styles.captureTitle}>{entryTab === 'voice' ? 'کالایت را بگو' : entryTab === 'photo' ? 'از کالا عکس بگیر' : 'بارکد کالا را بگیر'}</Text>
          <Text style={styles.captureText}>در این نسخه، نتیجه‌ی هوشمند به‌صورت نمایشی آماده می‌شود.</Text>
          <Button onPress={() => simulateEntry(entryTab)} variant="secondary" icon={entryTab === 'voice' ? 'mic' : entryTab === 'photo' ? 'camera' : 'barcode'}>شروع تشخیص</Button>
        </View>
      )}
      {entryMessage ? <View style={styles.infoBanner}><Icon name="spark" size={17} color={THEME.primary} /><Text style={styles.infoBannerText}>{entryMessage}</Text></View> : null}
      <Button onPress={() => addItem()} icon="plus" style={styles.modalPrimaryButton}>افزودن به لیست</Button>
      <Text style={styles.recentLabel}>آخرین کالاها</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChoices}>
        {['شیر', 'نان', 'تخم‌مرغ', 'میوه'].map((name) => <Pill key={name} onPress={() => setItemDraft((current) => ({ ...current, name }))}>{name}</Pill>)}
      </ScrollView>
    </ModalShell>
  );

  const renderNewListModal = () => (
    <ModalShell visible={modal === 'newList'} onClose={() => setModal(null)} title="لیست جدید">
      <Text style={styles.fieldLabel}>نام لیست</Text>
      <TextInput value={newListDraft.name} onChangeText={(name) => setNewListDraft((current) => ({ ...current, name }))} placeholder="مثلاً خرید ماهانه" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" autoFocus />
      <Text style={styles.fieldLabel}>آیکون لیست</Text>
      <View style={styles.emojiGrid}>{['house', 'cart-shopping', 'champagne-glasses', 'wrench', 'building', 'basket-shopping', 'shopping-bag', 'utensils'].map((emoji) => <Pressable key={emoji} onPress={() => setNewListDraft((current) => ({ ...current, emoji }))} style={[styles.emojiChoice, newListDraft.emoji === emoji && styles.emojiChoiceActive]}><Glyph value={emoji} size={20} color={newListDraft.emoji === emoji ? THEME.primary : THEME.muted} /></Pressable>)}</View>
      <Button onPress={createList} icon="plus" style={styles.modalPrimaryButton}>ساخت لیست</Button>
    </ModalShell>
  );

  const renderNewCategoryModal = () => (
    <ModalShell visible={modal === 'newCategory'} onClose={() => setModal(null)} title="دسته‌بندی جدید">
      <TextInput value={newCategoryDraft.label} onChangeText={(label) => setNewCategoryDraft((current) => ({ ...current, label }))} placeholder="مثلاً لوازم کودک" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" autoFocus />
      <Text style={styles.fieldLabel}>انتخاب ایموجی</Text>
      <View style={styles.emojiGrid}>{['bone', 'pump-soap', 'paw', 'book', 'leaf', 'gift', 'toolbox', 'box'].map((emoji) => <Pressable key={emoji} onPress={() => setNewCategoryDraft((current) => ({ ...current, emoji }))} style={[styles.emojiChoice, newCategoryDraft.emoji === emoji && styles.emojiChoiceActive]}><Glyph value={emoji} size={20} color={newCategoryDraft.emoji === emoji ? THEME.primary : THEME.muted} /></Pressable>)}</View>
      <Button onPress={addCategory} icon="plus" style={styles.modalPrimaryButton}>افزودن دسته‌بندی</Button>
    </ModalShell>
  );

  const renderPantryModal = () => (
    <ModalShell visible={modal === 'newPantry'} onClose={() => setModal(null)} title="افزودن به انبار">
      <TextInput value={pantryDraft.name} onChangeText={(name) => setPantryDraft((current) => ({ ...current, name }))} placeholder="نام کالا" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" autoFocus />
      <View style={styles.formRow}>
        <TextInput value={pantryDraft.quantity} onChangeText={(quantity) => setPantryDraft((current) => ({ ...current, quantity }))} placeholder="مقدار" placeholderTextColor={THEME.faint} style={[styles.input, styles.smallInput]} textAlign="right" />
        <TextInput value={pantryDraft.expiry} onChangeText={(expiry) => setPantryDraft((current) => ({ ...current, expiry }))} placeholder="روز تا انقضا" placeholderTextColor={THEME.faint} keyboardType="numeric" style={[styles.input, styles.priceInput]} textAlign="right" />
      </View>
      <Button onPress={addPantryItem} icon="plus" style={styles.modalPrimaryButton}>ذخیره در انبار</Button>
    </ModalShell>
  );

  const renderCategoryManager = () => (
    <ModalShell visible={modal === 'categories'} onClose={() => setModal(null)} title="مدیریت دسته‌بندی‌ها">
      <Button onPress={() => setModal('newCategory')} icon="plus" variant="secondary" style={styles.addInlineButton}>دسته‌بندی جدید</Button>
      <ScrollView style={styles.managerList}>
        {categories.map((category) => (
          <View key={category.id} style={styles.managerRow}>
            <Glyph value={category.emoji} size={19} color={THEME.primary} style={styles.managerEmoji} />
            <Text style={styles.managerName}>{category.label}</Text>
            <Pressable onPress={() => removeCategory(category.id)} style={styles.iconButton}><Icon name="trash" size={20} color={THEME.danger} /></Pressable>
          </View>
        ))}
      </ScrollView>
    </ModalShell>
  );

  const renderHistoryModal = () => (
    <ModalShell visible={modal === 'history'} onClose={() => setModal(null)} title="لیست‌های قبلی">
      {history.length ? history.map((record) => (
        <View key={record.id} style={styles.historyRow}>
          <View style={styles.historyIcon}><Icon name="receipt" size={21} color={THEME.primary} /></View>
          <View style={styles.historyMain}><Text style={styles.historyName}>{record.listName}</Text><Text style={styles.historyMeta}>{record.date} · {record.count} قلم</Text></View>
          <Text style={styles.historyTotal}>{formatMoney(record.total, setup.currency)}</Text>
        </View>
      )) : <EmptyState icon="box-archive" title="هنوز سابقه‌ای نیست" text="وقتی خریدی را تمام کنی، اینجا ذخیره می‌شود." />}
    </ModalShell>
  );

  const renderContactModal = () => (
    <ModalShell visible={modal === 'contact'} onClose={() => setModal(null)} title="ارتباط با NziCode">
      <View style={styles.contactBrand}><View style={styles.brandMini}><Text style={styles.brandMiniText}>N</Text></View><View><Text style={styles.contactName}>NziCode</Text><Text style={styles.contactSub}>توسعه‌دهنده‌ی خریدیار</Text></View></View>
      <Pressable onPress={() => openContact('whatsapp')} style={styles.contactRow}><Glyph value="whatsapp" size={19} color={THEME.primary} style={styles.contactEmoji} /><View style={styles.contactMain}><Text style={styles.contactLabel}>واتساپ</Text><Text style={styles.contactValue}>0919 843 3408</Text></View><Icon name="chevron" color={THEME.primary} /></Pressable>
      <Pressable onPress={() => openContact('telegram')} style={styles.contactRow}><Glyph value="telegram" size={19} color={THEME.primary} style={styles.contactEmoji} /><View style={styles.contactMain}><Text style={styles.contactLabel}>تلگرام</Text><Text style={styles.contactValue}>@NziCode</Text></View><Icon name="chevron" color={THEME.primary} /></Pressable>
      <Pressable onPress={() => openContact('email')} style={styles.contactRow}><Glyph value="envelope" size={17} color={THEME.primary} style={styles.contactEmoji} /><View style={styles.contactMain}><Text style={styles.contactLabel}>ایمیل</Text><Text style={styles.contactValue}>nazari.moradkhani@gmail.com</Text></View><Icon name="chevron" color={THEME.primary} /></Pressable>
    </ModalShell>
  );

  const renderHome = () => {
    const totalOpen = lists.reduce((sum, list) => sum + list.items.filter((item) => !item.done).length, 0);
    return (
      <>
        <View style={styles.homeTop}>
          <Pressable onPress={() => setMenuOpen(true)} style={styles.iconButton}><Icon name="menu" size={25} color={THEME.ink} /></Pressable>
          <View style={styles.greeting}><Text style={styles.greetingText}>سلام {setup.userName || 'دوست خریدیار'}</Text><Text style={styles.greetingSub}>امروز چه چیزی لازم داری؟</Text></View>
          <View style={styles.avatar}><Icon name="profile" size={19} color={THEME.primary} /></View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statNumber}>{lists.length}</Text><Text style={styles.statLabel}>لیست فعال</Text></View>
          <View style={styles.statCard}><Text style={styles.statNumber}>{totalOpen}</Text><Text style={styles.statLabel}>قلم باز</Text></View>
          <View style={styles.statCard}><Text style={styles.statNumber}>{pantry.length}</Text><Text style={styles.statLabel}>در انبار</Text></View>
        </View>
        <View style={styles.smartCard}>
          <View style={styles.smartHeader}><View style={styles.smartIcon}><Icon name="spark" size={24} color="#fff" /></View><View style={styles.smartHeaderText}><Text style={styles.smartEyebrow}>پیشنهاد هوشمند</Text><Text style={styles.smartTitle}>{SMART_SUGGESTIONS[0].title}</Text></View><Glyph value={SMART_SUGGESTIONS[0].icon} size={24} color={THEME.warning} style={styles.smartEmoji} /></View>
          <Text style={styles.smartText}>{SMART_SUGGESTIONS[0].text}</Text>
          <Pressable onPress={() => { setActiveListId(activeList?.id || lists[0]?.id); setModal('addItem'); setItemDraft((current) => ({ ...current, name: SMART_SUGGESTIONS[0].items[0] })); }} style={styles.smartAction}><Text style={styles.smartActionText}>افزودن پیشنهاد</Text><Icon name="arrow" size={19} color="#fff" /></Pressable>
        </View>
        <SectionTitle title="لیست‌های فعال" action="مشاهده همه" onAction={() => navigate('lists')} />
        {lists.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
          {lists.slice(0, 5).map((list) => {
            const done = list.items.filter((item) => item.done).length;
            const percent = list.items.length ? Math.round((done / list.items.length) * 100) : 0;
            return <Pressable key={list.id} onPress={() => { setActiveListId(list.id); setView('detail'); }} style={styles.listCard}>
              <View style={styles.listCardTop}><Glyph value={list.emoji} size={25} color={THEME.primary} style={styles.listEmoji} /><Icon name="chevron" size={19} color={THEME.faint} /></View>
              <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
              <Text style={styles.listMeta}>{list.items.length ? `${done} از ${list.items.length} انجام شد` : 'لیست خالی و آماده‌ی شروع'}</Text>
              <ProgressBar value={percent} />
              <View style={styles.listCardBottom}><Text style={styles.listPercent}>{percent}%</Text><View style={styles.memberCountRow}><Icon name="users" size={12} color={THEME.faint} /><Text style={styles.memberCount}>{list.members}</Text></View></View>
            </Pressable>;
          })}
          <Pressable onPress={() => setModal('newList')} style={[styles.listCard, styles.newListCard]}><View style={styles.newListCircle}><Icon name="plus" size={25} color={THEME.primary} /></View><Text style={styles.newListText}>لیست جدید</Text><Text style={styles.listMeta}>خانه، شرکت، مهمانی…</Text></Pressable>
        </ScrollView> : <EmptyState icon="clipboard-list" title="اولین لیستت را بساز" action="ساخت لیست" onAction={() => setModal('newList')} />}
        <SectionTitle title="دسترسی سریع" />
        <View style={styles.quickGrid}>
          <Pressable onPress={() => navigate('scanner')} style={styles.quickCard}><View style={[styles.quickIcon, { backgroundColor: '#E8F8F2' }]}><Icon name="scan" size={25} color={THEME.success} /></View><Text style={styles.quickTitle}>اسکن یخچال</Text><Text style={styles.quickSub}>تشخیص موجودی</Text></Pressable>
          <Pressable onPress={() => { setShoppingIndex(0); setView('shopping'); }} style={styles.quickCard}><View style={[styles.quickIcon, { backgroundColor: '#FFF0E9' }]}><Icon name="cart" size={25} color={THEME.accent} /></View><Text style={styles.quickTitle}>حالت خرید</Text><Text style={styles.quickSub}>خرید مرحله‌ای</Text></Pressable>
          <Pressable onPress={() => navigate('pantry')} style={styles.quickCard}><View style={[styles.quickIcon, { backgroundColor: '#FFF5D9' }]}><Icon name="pantry" size={25} color={THEME.warning} /></View><Text style={styles.quickTitle}>انبار خانه</Text><Text style={styles.quickSub}>تاریخ انقضا</Text></Pressable>
          <Pressable onPress={() => navigate('receipts')} style={styles.quickCard}><View style={[styles.quickIcon, { backgroundColor: '#ECEAFF' }]}><Icon name="receipt" size={25} color={THEME.primary} /></View><Text style={styles.quickTitle}>رسید و هزینه</Text><Text style={styles.quickSub}>گزارش ماهانه</Text></Pressable>
        </View>
        <View style={styles.tipCard}><Glyph value="lightbulb" size={22} color={THEME.warning} style={styles.tipEmoji} /><View style={styles.tipMain}><Text style={styles.tipTitle}>یک نکته‌ی کوچک</Text><Text style={styles.tipText}>اقلامی که همیشه تکرار می‌کنی را به انبار اضافه کن تا قبل از تمام‌شدن یادت بیندازد.</Text></View></View>
      </>
    );
  };

  const renderLists = () => (
    <>
      <ScreenHeader title="لیست‌های من" subtitle={`${lists.length} لیست فعال`} right={<Pressable onPress={() => setModal('newList')} style={styles.roundPrimary}><Icon name="plus" size={23} color="#fff" /></Pressable>} />
      <View style={styles.searchBox}><Icon name="search" size={21} color={THEME.primary} /><TextInput value={search} onChangeText={setSearch} placeholder="جست‌وجوی لیست‌ها" placeholderTextColor={THEME.faint} style={styles.searchInput} textAlign="right" /></View>
      {lists.length ? lists.filter((list) => !search.trim() || list.name.includes(search.trim())).map((list) => {
        const done = list.items.filter((item) => item.done).length;
        const percent = list.items.length ? Math.round((done / list.items.length) * 100) : 0;
        return <Pressable key={list.id} onPress={() => { setActiveListId(list.id); setView('detail'); }} style={styles.fullListCard}>
          <Glyph value={list.emoji} size={22} color={THEME.primary} style={styles.fullListEmoji} /><View style={styles.fullListMain}><View style={styles.fullListTitleRow}><Text style={styles.fullListName}>{list.name}</Text><Icon name="chevron" color={THEME.faint} /></View><Text style={styles.fullListMeta}>{list.items.length ? `${list.items.length} قلم · ${done} انجام‌شده` : 'برای افزودن کالا آماده است'}</Text><ProgressBar value={percent} /></View><Text style={styles.fullListPercent}>{percent}%</Text>
        </Pressable>;
      }) : <EmptyState icon="clipboard-list" title="لیستی نداری" text="برای خانه، شرکت یا مهمانی یک لیست بساز." action="ساخت لیست" onAction={() => setModal('newList')} />}
      <View style={styles.historyCallout}><View style={styles.historyCalloutIcon}><Icon name="clock" color={THEME.primary} /></View><View style={styles.historyCalloutMain}><Text style={styles.historyCalloutTitle}>لیست‌های قبلی</Text><Text style={styles.historyCalloutText}>{history.length ? `${history.length} خرید ذخیره شده` : 'هنوز خریدی ثبت نشده است'}</Text></View><Pressable onPress={() => setModal('history')}><Text style={styles.linkText}>مشاهده</Text></Pressable></View>
    </>
  );

  const renderDetail = () => (
    <View style={styles.detailWrap}>
      <ScreenHeader title={activeList?.name || 'جزئیات لیست'} subtitle={`${activeList?.members || 1} عضو · ${activeItems.length} قلم`} onBack={() => setView('home')} right={<View style={styles.headerActions}><Pressable onPress={shareActiveList} style={styles.iconButton}><Icon name="share" size={21} color={THEME.primary} /></Pressable><Pressable onPress={() => setMenuOpen(true)} style={styles.iconButton}><Icon name="more" size={20} color={THEME.muted} /></Pressable></View>} />
      <View style={styles.detailActionRow}><Pressable onPress={() => setModal('addItem')} style={styles.addInput}><Icon name="plus" size={21} color={THEME.primary} /><Text style={styles.addInputText}>کالا یا یادداشت جدید اضافه کن…</Text></Pressable><Pressable onPress={() => { setShoppingIndex(0); setView('shopping'); }} style={styles.shoppingButton}><Icon name="cart" size={19} color="#fff" /><Text style={styles.shoppingButtonText}>خرید</Text></Pressable></View>
      <View style={styles.searchBox}><Icon name="search" size={21} color={THEME.primary} /><TextInput value={search} onChangeText={setSearch} placeholder="جست‌وجوی کالا" placeholderTextColor={THEME.faint} style={styles.searchInput} textAlign="right" /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        <Pill active={filter === 'all'} onPress={() => setFilter('all')} emoji="wand-magic-sparkles">همه</Pill>
        {categories.map((category) => <Pill key={category.id} active={filter === category.id} onPress={() => setFilter(category.id)} emoji={category.emoji}>{category.label}</Pill>)}
        <Pill onPress={() => setModal('categories')} emoji="＋">مدیریت</Pill>
      </ScrollView>
      {!filteredItems.length ? <EmptyState icon="cart-shopping" title="این لیست هنوز خالی است" text="با افزودن یک کالا شروع کن؛ خریدیار بقیه را مرتب می‌کند." action="افزودن کالا" onAction={() => setModal('addItem')} /> : groupedItems.map((group) => (
        <View key={group.id} style={styles.itemGroup}>
          <View style={styles.groupHeader}><Glyph value={group.emoji} size={16} color={THEME.primary} style={styles.groupEmoji} /><Text style={styles.groupTitle}>{group.label}</Text><Text style={styles.groupCount}>{group.items.length}</Text></View>
          {group.items.map((item) => <Pressable key={item.id} onPress={() => toggleItem(item.id)} onLongPress={() => removeItem(item.id)} style={[styles.itemRow, item.done && styles.itemRowDone]}>
            <View style={[styles.checkCircle, item.done && styles.checkCircleDone]}>{item.done ? <Icon name="check" size={16} color="#fff" /> : null}</View><Glyph value={item.emoji} size={19} color={THEME.muted} style={styles.itemEmoji} /><View style={styles.itemMain}><Text style={[styles.itemName, item.done && styles.itemNameDone]}>{item.name}</Text><Text style={styles.itemMeta}>{item.quantity} · {item.price ? formatMoney(item.price, setup.currency) : 'قیمت ثبت نشده'}</Text></View><Icon name="chevron" size={18} color={THEME.faint} />
          </Pressable>)}
        </View>
      ))}
      <View style={styles.detailSpacer} />
      <View style={styles.totalBar}><View><Text style={styles.totalLabel}>جمع تخمینی</Text><Text style={styles.totalValue}>{formatMoney(estimatedTotal, setup.currency)}</Text></View><View style={styles.totalProgress}><Text style={styles.totalProgressText}>{completion}% انجام شد</Text><ProgressBar value={completion} color={THEME.success} /></View><Pressable onPress={archiveActiveList} style={styles.finishButton}><Icon name="check" size={18} color="#fff" /><Text style={styles.finishButtonText}>پایان خرید</Text></Pressable></View>
    </View>
  );

  const renderScanner = () => (
    <>
      <ScreenHeader title="اسکن یخچال و کابینت" subtitle="موجودی را با یک عکس مرتب کن" />
      <View style={styles.scannerHero}><View style={styles.scannerFrame}><Icon name="camera" size={48} color="#fff" /><Text style={styles.scannerFrameText}>{scannerCaptured ? 'تصویر تحلیل شد' : 'دوربین را به سمت یخچال بگیر'}</Text></View><Button onPress={captureScanner} icon="camera">{scannerCaptured ? 'اسکن دوباره' : 'گرفتن عکس'}</Button><Text style={styles.demoNote}>نسخه‌ی نمایشی؛ اتصال دوربین واقعی در build اندروید قابل افزودن است.</Text></View>
      <SectionTitle title="اقلام تشخیص‌داده‌شده" action={scannerItems.length ? 'افزودن همه' : null} onAction={() => scannerItems.forEach(addScannerItem)} />
      {scannerItems.length ? scannerItems.map((item) => <View key={item.id} style={styles.scanResultRow}><Glyph value={item.emoji} size={23} color={THEME.primary} style={styles.scanResultEmoji} /><View style={styles.scanResultMain}><Text style={styles.scanResultName}>{item.name}</Text><Text style={styles.scanResultMeta}>{getCategory(categories, item.category).label} · اطمینان {item.confidence}%</Text><ProgressBar value={item.confidence} color={THEME.success} /></View><Pressable onPress={() => addScannerItem(item)} style={styles.addSmall}><Icon name="plus" size={18} color={THEME.primary} /></Pressable></View>) : <EmptyState icon="camera" title="هنوز تصویری اسکن نشده" text="از یخچال یا کابینت عکس بگیر تا اقلام پیشنهادی را ببینی." />}
      <View style={styles.scanTips}><Text style={styles.scanTipsTitle}>برای نتیجه‌ی بهتر</Text><Text style={styles.scanTip}>• نور محیط کافی باشد و درِ قفسه‌ها باز باشد.</Text><Text style={styles.scanTip}>• هر بار یک بخش از یخچال را اسکن کن.</Text></View>
    </>
  );

  const renderShopping = () => {
    const current = openItems[shoppingIndex];
    const doneCount = activeItems.length - openItems.length;
    return (
      <View style={styles.shoppingWrap}>
        <ScreenHeader title="حالت خرید" subtitle={activeList?.name || 'لیست خرید'} onBack={() => setView('detail')} dark right={<Text style={styles.shoppingCounter}>{doneCount}/{activeItems.length}</Text>} />
        <View style={styles.routeCard}><View style={styles.routeHeader}><Icon name="route" size={23} color={THEME.primary} /><Text style={styles.routeTitle}>مسیر پیشنهادی فروشگاه</Text><Text style={styles.routeAisle}>راهرو {current?.aisle || '—'}</Text></View><View style={styles.routeMap}><View style={styles.routeLine} /><View style={styles.routeDot}><Icon name="cart" size={16} color={THEME.primary} /></View>{['لبنیات', 'میوه', 'خواربار', 'صندوق'].map((label, index) => <View key={label} style={[styles.routeStop, { top: 22 + index * 36 }]}><View style={[styles.stopDot, index === 0 && styles.stopDotActive]} /><Text style={styles.stopLabel}>{label}</Text></View>)}</View></View>
        {current ? <View style={styles.currentItemCard}><Text style={styles.currentEyebrow}>کالای بعدی</Text><Glyph value={current.emoji} size={56} color={THEME.primary} style={styles.currentEmoji} /><Text style={styles.currentName}>{current.name}</Text><Text style={styles.currentQuantity}>{current.quantity} · {current.price ? formatMoney(current.price, setup.currency) : 'قیمت تقریبی ثبت نشده'}</Text><View style={styles.swipeHint}><Text style={styles.swipeHintText}>برای انجام‌شدن، دکمه‌ی تیک را بزن</Text></View><View style={styles.shoppingControls}><Pressable onPress={() => setShoppingIndex((index) => Math.min(index + 1, Math.max(openItems.length - 1, 0)))} style={styles.skipButtonLarge}><Text style={styles.skipButtonText}>بعداً</Text></Pressable><Pressable onPress={() => { toggleItem(current.id); setShoppingIndex((index) => Math.min(index, Math.max(openItems.length - 2, 0))); }} style={styles.doneButtonLarge}><Icon name="check" size={28} color="#fff" /><Text style={styles.doneButtonText}>برداشتم</Text></Pressable></View></View> : <EmptyState icon="champagne-glasses" title="خریدت تمام شد!" text="همه‌ی اقلام این لیست را برداشتی." action="ذخیره و بازگشت" onAction={archiveActiveList} />}
        <View style={styles.shoppingBottom}><View><Text style={styles.shoppingBottomLabel}>جمع لحظه‌ای</Text><Text style={styles.shoppingBottomValue}>{formatMoney(completedTotal, setup.currency)}</Text></View><ProgressBar value={activeItems.length ? (doneCount / activeItems.length) * 100 : 0} color={THEME.success} /></View>
      </View>
    );
  };

  const renderPantry = () => (
    <>
      <ScreenHeader title="انبار خانه" subtitle="موجودی و تاریخ انقضا" right={<Pressable onPress={() => setModal('newPantry')} style={styles.roundPrimary}><Icon name="plus" size={23} color="#fff" /></Pressable>} />
      <View style={styles.pantrySummary}><View><Text style={styles.pantrySummaryLabel}>اقلام موجود</Text><Text style={styles.pantrySummaryNumber}>{pantry.length}</Text></View><View style={styles.pantryLegend}><Text style={styles.legendItem}><Text style={{ color: THEME.danger }}>●</Text> فوری</Text><Text style={styles.legendItem}><Text style={{ color: THEME.warning }}>●</Text> نزدیک</Text><Text style={styles.legendItem}><Text style={{ color: THEME.success }}>●</Text> مناسب</Text></View></View>
      {pantry.length ? pantry.map((item) => {
        const tone = item.expiry <= 1 ? 'danger' : item.expiry <= 3 ? 'warning' : 'success';
        return <View key={item.id} style={[styles.pantryRow, tone === 'danger' ? styles.pantryDanger : tone === 'warning' ? styles.pantryWarning : styles.pantrySuccess]}><Glyph value={item.emoji} size={23} color={THEME.primary} style={styles.pantryEmoji} /><View style={styles.pantryMain}><Text style={styles.pantryName}>{item.name}</Text><Text style={styles.pantryMeta}>{item.quantity} · {item.expiry <= 0 ? 'منقضی شده' : `${item.expiry} روز تا انقضا`}</Text></View><Button onPress={() => addPantryToList(item)} variant="ghost" icon="plus">لیست خرید</Button></View>;
      }) : <EmptyState icon="box-archive" title="انبارت خالی است" text="موجودی خانه را ثبت کن تا تاریخ انقضا را از دست ندهی." action="افزودن موجودی" onAction={() => setModal('newPantry')} />}
      <View style={styles.pantryTip}><Glyph value="clock" size={19} color={THEME.warning} style={styles.pantryTipEmoji} /><Text style={styles.pantryTipText}>اقلامی که کمتر از سه روز تا انقضا دارند، بالای صفحه هشدار می‌گیرند.</Text></View>
    </>
  );

  const renderReceipts = () => {
    const chart = [290, 420, 350, receipts.length ? 485 : 260];
    const max = Math.max(...chart);
    return (
      <>
        <ScreenHeader title="رسیدها و هزینه‌ها" subtitle="تصویر واضح‌تری از خریدها" />
        <View style={styles.receiptScanCard}><View style={styles.receiptScanIcon}><Icon name="receipt" size={32} color="#fff" /></View><View style={styles.receiptScanMain}><Text style={styles.receiptScanTitle}>رسید جدید داری؟</Text><Text style={styles.receiptScanText}>با OCR مبلغ و اقلام را خودکار ثبت کن.</Text></View><Button onPress={scanReceipt} icon="camera" disabled={receiptScanning}>{receiptScanning ? 'در حال خواندن…' : 'اسکن رسید'}</Button></View>
        <View style={styles.monthCard}><SectionTitle title="هزینه‌ی این ماه" action="مقایسه با ماه قبل" /><View style={styles.monthTotalRow}><Text style={styles.monthTotal}>{formatMoney(receipts.length ? 485000 : 0, setup.currency)}</Text><View style={styles.changeBadge}><Text style={styles.changeText}>{receipts.length ? '+۸٪' : '—'}</Text></View></View><View style={styles.chart}>{chart.map((value, index) => <View key={index} style={styles.chartCol}><View style={[styles.chartBar, { height: `${(value / max) * 100}%`, backgroundColor: index === chart.length - 1 ? THEME.primary : '#D9D8F7' }]} /><Text style={styles.chartLabel}>{['فروردین', 'اردیبهشت', 'خرداد', 'تیر'][index]}</Text></View>)}</View></View>
        <SectionTitle title="رسیدهای اخیر" />
        {receipts.length ? receipts.map((receipt) => <View key={receipt.id} style={styles.receiptRow}><View style={styles.receiptIcon}><Icon name="receipt" color={THEME.primary} /></View><View style={styles.receiptMain}><Text style={styles.receiptStore}>{receipt.store}</Text><Text style={styles.receiptMeta}>{receipt.date} · {receipt.count} قلم</Text></View><Text style={styles.receiptTotal}>{formatMoney(receipt.total, setup.currency)}</Text></View>) : <EmptyState icon="receipt" title="رسیدی ثبت نشده" text="یک رسید نمونه اسکن کن تا گزارش هزینه ساخته شود." />}
      </>
    );
  };

  const renderFamily = () => (
    <>
      <ScreenHeader title="خانواده و امتیازها" subtitle="با هم خرید بهتری داشته باشید" />
      <View style={styles.familyHero}><Glyph value="trophy" size={26} color="#fff" style={styles.familyHeroEmoji} /><View><Text style={styles.familyHeroTitle}>تیم خریدیار</Text><Text style={styles.familyHeroText}>با تکمیل لیست‌ها امتیاز بگیر و نشان جمع کن.</Text></View><Button onPress={shareActiveList} variant="secondary" icon="share">دعوت</Button></View>
      <SectionTitle title="صرفه‌جویی این ماه" /><View style={styles.leaderboard}>{[{ name: setup.userName || 'شما', points: 420, emoji: 'user' }, { name: 'سارا', points: 360, emoji: 'user' }, { name: 'امیر', points: 280, emoji: 'user' }].map((member, index) => <View key={member.name} style={styles.leaderRow}><Text style={styles.leaderRank}>{index + 1}</Text><Glyph value={member.emoji} size={19} color={THEME.primary} style={styles.leaderEmoji} /><Text style={styles.leaderName}>{member.name}</Text><Text style={styles.leaderPoints}>{member.points} امتیاز</Text></View>)}</View>
      <SectionTitle title="نشان‌های تو" /><View style={styles.badgeRow}>{[['brain', 'خریدار هوشمند'], ['leaf', 'سبز زندگی کن'], ['bolt', 'سریع و مرتب']].map(([emoji, label]) => <View key={label} style={styles.badgeCard}><Glyph value={emoji} size={23} color={THEME.primary} style={styles.badgeEmoji} /><Text style={styles.badgeLabel}>{label}</Text></View>)}</View>
      <SectionTitle title="گفت‌وگوی لیست" />
      {(family.comments || []).length ? (family.comments || []).map((comment) => <View key={comment.id} style={styles.commentCard}><Glyph value={comment.emoji || 'comment'} size={19} color={THEME.primary} style={styles.commentEmoji} /><View style={styles.commentMain}><Text style={styles.commentName}>{comment.name}</Text><Text style={styles.commentText}>{comment.text}</Text></View><Text style={styles.commentTime}>{comment.date}</Text></View>) : <View style={styles.commentCard}><Glyph value="comment" size={19} color={THEME.primary} style={styles.commentEmoji} /><View style={styles.commentMain}><Text style={styles.commentName}>گفت‌وگوی خانوادگی</Text><Text style={styles.commentText}>اولین نظر را روی لیست ثبت کن.</Text></View></View>}
      <View style={styles.commentInput}><TextInput value={commentDraft} onChangeText={setCommentDraft} placeholder="کامنت روی لیست…" placeholderTextColor={THEME.faint} style={styles.commentTextInput} textAlign="right" /><Button onPress={addComment} variant="ghost" icon="arrow">ارسال</Button></View>
    </>
  );

  const renderProfile = () => (
    <>
      <ScreenHeader title="پروفایل و تنظیمات" subtitle="کنترل خریدیار در دستان تو" />
      <View style={styles.profileCard}><View style={styles.profileAvatar}><Icon name="profile" size={22} color={THEME.primary} /></View><View style={styles.profileMain}><Text style={styles.profileName}>{setup.userName || 'دوست خریدیار'}</Text><Text style={styles.profileMeta}>عضو خریدیار · NziCode</Text></View><Pressable onPress={() => { setOnboardingDraft((current) => ({ ...current, name: setup.userName })); setModal('editProfile'); }} style={styles.iconButton}><Icon name="edit" color={THEME.primary} /></Pressable></View>
      <SectionTitle title="ترجیحات" />
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}><View style={styles.settingIcon}><Icon name="bell" color={THEME.primary} /></View><View style={styles.settingMain}><Text style={styles.settingTitle}>اعلان‌ها</Text><Text style={styles.settingSub}>یادآوری انقضا و لیست‌های مشترک</Text></View><Pressable onPress={() => setSetup((current) => ({ ...current, notifications: !current.notifications }))} style={[styles.switch, setup.notifications && styles.switchOn]}><View style={[styles.switchKnob, setup.notifications && styles.switchKnobOn]} /></Pressable></View>
        <View style={styles.settingRow}><View style={styles.settingIcon}><Icon name="cloud" color={THEME.primary} /></View><View style={styles.settingMain}><Text style={styles.settingTitle}>حالت آفلاین</Text><Text style={styles.settingSub}>اطلاعات روی همین دستگاه ذخیره می‌شود</Text></View><Pressable onPress={() => setSetup((current) => ({ ...current, offline: !current.offline }))} style={[styles.switch, setup.offline && styles.switchOn]}><View style={[styles.switchKnob, setup.offline && styles.switchKnobOn]} /></Pressable></View>
        <View style={styles.settingRow}><View style={styles.settingIcon}><Glyph value="money-bill" size={16} color={THEME.primary} /></View><View style={styles.settingMain}><Text style={styles.settingTitle}>واحد پول</Text><Text style={styles.settingSub}>{setup.currency}</Text></View><Pressable onPress={() => setModal('currency')}><Icon name="chevron" color={THEME.faint} /></Pressable></View>
        <View style={styles.settingRow}><View style={styles.settingIcon}><Glyph value="bowl-food" size={16} color={THEME.primary} /></View><View style={styles.settingMain}><Text style={styles.settingTitle}>حالت غذایی</Text><Text style={styles.settingSub}>{setup.diet}</Text></View><Pressable onPress={() => setModal('diet')}><Icon name="chevron" color={THEME.faint} /></Pressable></View>
      </View>
      <SectionTitle title="ابزارها" />
      <View style={styles.settingsCard}><Pressable onPress={() => navigate('family')} style={styles.settingRow}><View style={styles.settingIcon}><Icon name="users" color={THEME.primary} /></View><View style={styles.settingMain}><Text style={styles.settingTitle}>اعضای خانواده و امتیازها</Text><Text style={styles.settingSub}>دعوت، لیدربرد و کامنت‌ها</Text></View><Icon name="chevron" color={THEME.faint} /></Pressable><Pressable onPress={() => navigate('receipts')} style={styles.settingRow}><View style={styles.settingIcon}><Icon name="receipt" color={THEME.primary} /></View><View style={styles.settingMain}><Text style={styles.settingTitle}>رسیدها و گزارش هزینه</Text><Text style={styles.settingSub}>OCR و نمودار ماهانه</Text></View><Icon name="chevron" color={THEME.faint} /></Pressable><Pressable onPress={exportBackup} style={styles.settingRow}><View style={styles.settingIcon}><Icon name="cloud" color={THEME.primary} /></View><View style={styles.settingMain}><Text style={styles.settingTitle}>پشتیبان‌گیری آفلاین</Text><Text style={styles.settingSub}>خروجی JSON از لیست‌ها و تنظیمات</Text></View><Icon name="chevron" color={THEME.faint} /></Pressable><Pressable onPress={() => setModal('contact')} style={styles.settingRow}><View style={styles.settingIcon}><Glyph value="comment" size={16} color={THEME.primary} /></View><View style={styles.settingMain}><Text style={styles.settingTitle}>ارتباط با ما</Text><Text style={styles.settingSub}>پشتیبانی توسط NziCode</Text></View><Icon name="chevron" color={THEME.faint} /></Pressable></View>
      <Pressable onPress={resetData} style={styles.resetRow}><Icon name="trash" color={THEME.danger} /><Text style={styles.resetText}>پاک‌کردن اطلاعات محلی</Text></Pressable>
      <Text style={styles.versionText}>خریدیار ۱.۰ · طراحی و توسعه NziCode</Text>
    </>
  );

  const renderEditProfileModal = () => (
    <ModalShell visible={modal === 'editProfile'} onClose={() => setModal(null)} title="ویرایش پروفایل">
      <TextInput value={onboardingDraft.name} onChangeText={(name) => setOnboardingDraft((current) => ({ ...current, name }))} placeholder="نام شما" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" autoFocus />
      <Button onPress={() => { setSetup((current) => ({ ...current, userName: onboardingDraft.name.trim() || 'دوست خریدیار' })); setModal(null); }} icon="check" style={styles.modalPrimaryButton}>ذخیره</Button>
    </ModalShell>
  );

  const renderChoiceModal = (kind) => {
    const isCurrency = kind === 'currency';
    const choices = isCurrency ? ['تومان', 'ریال', 'دلار'] : ['بدون محدودیت', 'گیاه‌خواری', 'کم‌قند', 'ورزشی'];
    return <ModalShell visible={modal === kind} onClose={() => setModal(null)} title={isCurrency ? 'واحد پول' : 'حالت غذایی'}><View style={styles.choiceList}>{choices.map((choice) => <Pressable key={choice} onPress={() => { setSetup((current) => ({ ...current, [isCurrency ? 'currency' : 'diet']: choice })); setModal(null); }} style={styles.choiceListRow}><Text style={styles.choiceListText}>{choice}</Text><View style={[styles.radio, setup[isCurrency ? 'currency' : 'diet'] === choice && styles.radioActive]}>{setup[isCurrency ? 'currency' : 'diet'] === choice ? <Icon name="check" size={15} color="#fff" /> : null}</View></Pressable>)}</View></ModalShell>;
  };

  const content = view === 'home' ? renderHome()
    : view === 'lists' ? renderLists()
      : view === 'detail' ? renderDetail()
        : view === 'scanner' ? renderScanner()
          : view === 'shopping' ? renderShopping()
            : view === 'pantry' ? renderPantry()
              : view === 'receipts' ? renderReceipts()
                : view === 'family' ? renderFamily()
                  : renderProfile();

  const rootTab = ['home', 'lists', 'scanner', 'pantry', 'profile'].includes(view) ? view : null;

  return (
    <SafeAreaView style={styles.appShell}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appBody}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{content}</ScrollView>
        {rootTab ? <View style={styles.bottomNav}>{NAV_ITEMS.map((item) => <Pressable key={item.id} onPress={() => navigate(item.id)} style={[styles.navItem, rootTab === item.id && styles.navItemActive]}><View style={[styles.navIcon, rootTab === item.id && styles.navIconActive]}><Icon name={item.icon} size={21} color={rootTab === item.id ? THEME.primary : THEME.muted} /></View><Text style={[styles.navLabel, rootTab === item.id && styles.navLabelActive]}>{item.label}</Text></Pressable>)}</View> : null}
      </View>
      {renderMenuModal()}
      {renderAddItemModal()}
      {renderNewListModal()}
      {renderNewCategoryModal()}
      {renderPantryModal()}
      {renderCategoryManager()}
      {renderHistoryModal()}
      {renderContactModal()}
      {renderEditProfileModal()}
      {renderChoiceModal('currency')}
      {renderChoiceModal('diet')}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appShell: { flex: 1, backgroundColor: THEME.background },
  appBody: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 105 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.background },
  loadingLogo: { fontSize: 46, marginBottom: 12 },
  loadingText: { fontFamily: FONT, color: THEME.muted, fontSize: 15 },
  homeTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { flex: 1, alignItems: 'flex-end', marginHorizontal: 12 },
  greetingText: { fontFamily: FONT, fontSize: 22, fontWeight: '800', color: THEME.ink },
  greetingSub: { fontFamily: FONT, fontSize: 13, color: THEME.muted, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 23 },
  iconButton: { minWidth: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: THEME.surface, borderRadius: 20, padding: 14, alignItems: 'flex-end', borderWidth: 1, borderColor: THEME.line },
  statNumber: { fontFamily: FONT, color: THEME.primary, fontSize: 22, fontWeight: '800' },
  statLabel: { fontFamily: FONT, color: THEME.muted, fontSize: 12, marginTop: 3 },
  smartCard: { backgroundColor: THEME.dark, borderRadius: 26, padding: 19, marginBottom: 25 },
  smartHeader: { flexDirection: 'row-reverse', alignItems: 'center' },
  smartIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  smartHeaderText: { flex: 1, alignItems: 'flex-end', marginHorizontal: 11 },
  smartEyebrow: { fontFamily: FONT, color: '#B9B2E9', fontSize: 11 },
  smartTitle: { fontFamily: FONT, color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 2 },
  smartEmoji: { fontSize: 28 },
  smartText: { fontFamily: FONT, color: '#D7D2EE', fontSize: 13, lineHeight: 23, textAlign: 'right', marginTop: 13 },
  smartAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingVertical: 7 },
  smartActionText: { fontFamily: FONT, color: '#fff', fontSize: 13, fontWeight: '700' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, marginTop: 4 },
  sectionTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 17, fontWeight: '800', textAlign: 'right' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontFamily: FONT, color: THEME.primary, fontSize: 12, fontWeight: '700' },
  // App.js otherwise assumes an LTR base direction and mirrors layout
  // manually with flexDirection: 'row-reverse'. Horizontally-scrollable
  // rows are the one exception: a row-reverse *scroll* container still
  // starts its scroll position at the left in an LTR document, clipping
  // the visually-first (rightmost) card. Scoping direction: 'rtl' to just
  // these scroll containers makes the browser anchor scrolling to the
  // right, matching the row-reverse content.
  horizontalCards: { flexDirection: 'row', gap: 12, paddingBottom: 7 },
  listCard: { width: 225, backgroundColor: THEME.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: THEME.line },
  listCardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  listEmoji: { fontSize: 29 },
  listName: { fontFamily: FONT, color: THEME.ink, fontSize: 16, fontWeight: '800', textAlign: 'right', marginTop: 13 },
  listMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 11, textAlign: 'right', marginTop: 4, minHeight: 18 },
  progressTrack: { height: 7, borderRadius: 6, backgroundColor: '#E9EAF2', overflow: 'hidden', marginTop: 11 },
  progressFill: { height: '100%', borderRadius: 6 },
  listCardBottom: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 9 },
  listPercent: { fontFamily: FONT, fontSize: 11, color: THEME.primary, fontWeight: '700' },
  memberCountRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  memberCount: { fontFamily: FONT, color: THEME.muted, fontSize: 11 },
  newListCard: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: '#BDB9F1' },
  newListCircle: { width: 47, height: 47, borderRadius: 20, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  newListText: { fontFamily: FONT, color: THEME.primary, fontSize: 15, fontWeight: '800', marginTop: 11 },
  quickGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  quickCard: { width: '48.5%', backgroundColor: THEME.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: THEME.line },
  quickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickTitle: { fontFamily: FONT, fontSize: 14, fontWeight: '800', color: THEME.ink, textAlign: 'right' },
  quickSub: { fontFamily: FONT, color: THEME.muted, fontSize: 11, textAlign: 'right', marginTop: 3 },
  tipCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, backgroundColor: '#FFFDF2', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#F5E9B2' },
  tipEmoji: { fontSize: 25 },
  tipMain: { flex: 1, alignItems: 'flex-end' },
  tipTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 13, fontWeight: '800' },
  tipText: { fontFamily: FONT, color: THEME.muted, fontSize: 11, lineHeight: 19, textAlign: 'right', marginTop: 3 },
  screenHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  screenHeaderDark: { backgroundColor: THEME.dark, marginHorizontal: -20, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 18, marginTop: -18 },
  headerLeading: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, flex: 1 },
  screenTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 22, fontWeight: '800', textAlign: 'right' },
  screenTitleDark: { color: '#fff' },
  screenSubtitle: { fontFamily: FONT, color: THEME.muted, fontSize: 12, marginTop: 3, textAlign: 'right' },
  screenSubtitleDark: { color: '#C8C3E0' },
  headerActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  roundPrimary: { width: 42, height: 42, borderRadius: 15, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  searchBox: { minHeight: 48, backgroundColor: THEME.surface, borderRadius: 15, borderWidth: 1, borderColor: THEME.line, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 13, marginBottom: 13 },
  searchInput: { flex: 1, fontFamily: FONT, color: THEME.ink, fontSize: 13, paddingVertical: 9, marginRight: 7 },
  fullListCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 20, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: THEME.line },
  fullListEmoji: { fontSize: 31, marginLeft: 13 },
  fullListMain: { flex: 1 },
  fullListTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fullListName: { fontFamily: FONT, color: THEME.ink, fontSize: 15, fontWeight: '800' },
  fullListMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 11, textAlign: 'right', marginTop: 4 },
  fullListPercent: { fontFamily: FONT, color: THEME.primary, fontSize: 12, fontWeight: '800', marginRight: 10 },
  historyCallout: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.primarySoft, borderRadius: 20, padding: 14, marginTop: 12 },
  historyCalloutIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  historyCalloutMain: { flex: 1, alignItems: 'flex-end', marginHorizontal: 10 },
  historyCalloutTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 13, fontWeight: '800' },
  historyCalloutText: { fontFamily: FONT, color: THEME.muted, fontSize: 11, marginTop: 2 },
  linkText: { fontFamily: FONT, color: THEME.primary, fontSize: 12, fontWeight: '800' },
  detailWrap: { flex: 1 },
  detailActionRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 11 },
  addInput: { flex: 1, minHeight: 48, borderRadius: 15, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 13, gap: 8 },
  addInputText: { fontFamily: FONT, color: THEME.faint, fontSize: 12, flex: 1, textAlign: 'right' },
  shoppingButton: { minHeight: 48, borderRadius: 15, backgroundColor: THEME.dark, flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 15 },
  shoppingButtonText: { fontFamily: FONT, color: '#fff', fontSize: 12, fontWeight: '800' },
  categoryScroll: { flexDirection: 'row', gap: 7, paddingBottom: 13 },
  pill: { minHeight: 35, borderRadius: 14, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 5 },
  pillActive: { backgroundColor: THEME.primarySoft, borderColor: '#D3CEFF' },
  pillText: { fontFamily: FONT, color: THEME.muted, fontSize: 11 },
  pillTextActive: { color: THEME.primary, fontWeight: '800' },
  pillEmoji: { fontSize: 15 },
  itemGroup: { marginBottom: 14 },
  groupHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, paddingVertical: 8 },
  groupEmoji: { fontSize: 19 },
  groupTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'right' },
  groupCount: { fontFamily: FONT, color: THEME.faint, fontSize: 11 },
  itemRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 16, padding: 12, marginBottom: 7, borderWidth: 1, borderColor: THEME.line },
  itemRowDone: { backgroundColor: '#FBFBFD', opacity: 0.7 },
  checkCircle: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#C6C9D7', alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: THEME.success, borderColor: THEME.success },
  itemEmoji: { fontSize: 22, marginHorizontal: 10 },
  itemMain: { flex: 1, alignItems: 'flex-end' },
  itemName: { fontFamily: FONT, color: THEME.ink, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  itemNameDone: { textDecorationLine: 'line-through', color: THEME.muted },
  itemMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 10, marginTop: 3, textAlign: 'right' },
  detailSpacer: { height: 84 },
  totalBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: THEME.dark, borderRadius: 20, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  totalLabel: { fontFamily: FONT, color: '#C7C1E3', fontSize: 10, textAlign: 'right' },
  totalValue: { fontFamily: FONT, color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 2, textAlign: 'right' },
  totalProgress: { flex: 1 },
  totalProgressText: { fontFamily: FONT, color: '#D9D4ED', fontSize: 10, textAlign: 'right', marginBottom: 3 },
  finishButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: THEME.success, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 11 },
  finishButtonText: { fontFamily: FONT, color: '#fff', fontSize: 11, fontWeight: '800' },
  scannerHero: { backgroundColor: THEME.dark, borderRadius: 26, padding: 15, alignItems: 'center', marginBottom: 23 },
  scannerFrame: { width: '100%', height: 205, borderRadius: 20, borderWidth: 1.5, borderColor: '#8981C7', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#302B50', marginBottom: 14 },
  scannerFrameText: { fontFamily: FONT, color: '#D8D3ED', fontSize: 13, marginTop: 10 },
  demoNote: { fontFamily: FONT, color: '#AAA4C8', fontSize: 10, marginTop: 11, textAlign: 'center' },
  scanResultRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 20, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: THEME.line },
  scanResultEmoji: { fontSize: 27, marginLeft: 11 },
  scanResultMain: { flex: 1, alignItems: 'flex-end' },
  scanResultName: { fontFamily: FONT, color: THEME.ink, fontSize: 14, fontWeight: '800' },
  scanResultMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 10, marginTop: 3 },
  addSmall: { width: 35, height: 35, borderRadius: 12, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  scanTips: { backgroundColor: '#FFFDF2', borderRadius: 20, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#F5E9B2' },
  scanTipsTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 6 },
  scanTip: { fontFamily: FONT, color: THEME.muted, fontSize: 11, lineHeight: 21, textAlign: 'right' },
  shoppingWrap: { flex: 1 },
  shoppingCounter: { fontFamily: FONT, color: '#fff', fontSize: 13, fontWeight: '800' },
  routeCard: { backgroundColor: THEME.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: THEME.line, marginBottom: 13 },
  routeHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  routeTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 13, fontWeight: '800', flex: 1, textAlign: 'right' },
  routeAisle: { fontFamily: FONT, color: THEME.primary, fontSize: 11 },
  routeMap: { height: 165, backgroundColor: '#F7F7FC', borderRadius: 15, marginTop: 12, position: 'relative', overflow: 'hidden' },
  routeLine: { position: 'absolute', right: 33, top: 24, bottom: 20, width: 3, backgroundColor: '#D7D3FA', borderRadius: 3 },
  routeDot: { position: 'absolute', right: 17, bottom: 12, width: 35, height: 35, borderRadius: 13, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  routeStop: { position: 'absolute', right: 21, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  stopDot: { width: 17, height: 17, borderRadius: 8.5, backgroundColor: '#fff', borderWidth: 3, borderColor: '#C8C4EE' },
  stopDotActive: { borderColor: THEME.primary, backgroundColor: THEME.primarySoft },
  stopLabel: { fontFamily: FONT, color: THEME.muted, fontSize: 11 },
  currentItemCard: { backgroundColor: THEME.surface, borderRadius: 26, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: THEME.line },
  currentEyebrow: { fontFamily: FONT, color: THEME.primary, fontSize: 11, fontWeight: '800' },
  currentEmoji: { fontSize: 70, marginVertical: 13 },
  currentName: { fontFamily: FONT, color: THEME.ink, fontSize: 24, fontWeight: '900' },
  currentQuantity: { fontFamily: FONT, color: THEME.muted, fontSize: 12, marginTop: 5 },
  swipeHint: { backgroundColor: THEME.background, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 17 },
  swipeHintText: { fontFamily: FONT, color: THEME.muted, fontSize: 10 },
  shoppingControls: { width: '100%', flexDirection: 'row-reverse', gap: 9, marginTop: 19 },
  skipButtonLarge: { flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: THEME.background, alignItems: 'center', justifyContent: 'center' },
  skipButtonText: { fontFamily: FONT, color: THEME.muted, fontSize: 13, fontWeight: '800' },
  doneButtonLarge: { flex: 2, minHeight: 52, borderRadius: 16, backgroundColor: THEME.success, flexDirection: 'row-reverse', gap: 7, alignItems: 'center', justifyContent: 'center' },
  doneButtonText: { fontFamily: FONT, color: '#fff', fontSize: 14, fontWeight: '800' },
  shoppingBottom: { backgroundColor: THEME.dark, borderRadius: 20, padding: 14, marginTop: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  shoppingBottomLabel: { fontFamily: FONT, color: '#C7C1E3', fontSize: 10 },
  shoppingBottomValue: { fontFamily: FONT, color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 2 },
  pantrySummary: { backgroundColor: THEME.surface, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: THEME.line, marginBottom: 14 },
  pantrySummaryLabel: { fontFamily: FONT, color: THEME.muted, fontSize: 11, textAlign: 'right' },
  pantrySummaryNumber: { fontFamily: FONT, color: THEME.ink, fontSize: 27, fontWeight: '900', textAlign: 'right', marginTop: 2 },
  pantryLegend: { alignItems: 'flex-end', gap: 4 },
  legendItem: { fontFamily: FONT, color: THEME.muted, fontSize: 10 },
  pantryRow: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 20, padding: 13, marginBottom: 8, borderWidth: 1 },
  pantryDanger: { backgroundColor: THEME.dangerSoft, borderColor: '#F7C8CC' },
  pantryWarning: { backgroundColor: THEME.warningSoft, borderColor: '#F6E1A0' },
  pantrySuccess: { backgroundColor: THEME.successSoft, borderColor: '#BDEDD9' },
  pantryEmoji: { fontSize: 27, marginLeft: 10 },
  pantryMain: { flex: 1, alignItems: 'flex-end' },
  pantryName: { fontFamily: FONT, color: THEME.ink, fontSize: 14, fontWeight: '800' },
  pantryMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 10, marginTop: 3 },
  pantryTip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: THEME.primarySoft, borderRadius: 16, padding: 13, marginTop: 9 },
  pantryTipEmoji: { fontSize: 20 },
  pantryTipText: { flex: 1, fontFamily: FONT, color: THEME.muted, fontSize: 11, lineHeight: 19, textAlign: 'right' },
  receiptScanCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.dark, borderRadius: 20, padding: 14, marginBottom: 17, gap: 10 },
  receiptScanIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  receiptScanMain: { flex: 1, alignItems: 'flex-end' },
  receiptScanTitle: { fontFamily: FONT, color: '#fff', fontSize: 14, fontWeight: '800' },
  receiptScanText: { fontFamily: FONT, color: '#C8C2E0', fontSize: 10, marginTop: 3, textAlign: 'right' },
  monthCard: { backgroundColor: THEME.surface, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: THEME.line, marginBottom: 19 },
  monthTotalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, marginBottom: 10 },
  monthTotal: { fontFamily: FONT, color: THEME.ink, fontSize: 23, fontWeight: '900' },
  changeBadge: { backgroundColor: THEME.dangerSoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  changeText: { fontFamily: FONT, color: THEME.danger, fontSize: 10, fontWeight: '800' },
  chart: { height: 145, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 9, paddingTop: 10 },
  chartCol: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '65%', borderRadius: 7, minHeight: 8 },
  chartLabel: { fontFamily: FONT, color: THEME.muted, fontSize: 9, marginTop: 7 },
  receiptRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: THEME.line },
  receiptIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  receiptMain: { flex: 1, alignItems: 'flex-end', marginHorizontal: 10 },
  receiptStore: { fontFamily: FONT, color: THEME.ink, fontSize: 13, fontWeight: '800' },
  receiptMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 10, marginTop: 3 },
  receiptTotal: { fontFamily: FONT, color: THEME.primary, fontSize: 12, fontWeight: '800' },
  familyHero: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.primarySoft, borderRadius: 20, padding: 14, gap: 9, marginBottom: 19 },
  familyHeroEmoji: { fontSize: 31 },
  familyHeroTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  familyHeroText: { fontFamily: FONT, color: THEME.muted, fontSize: 10, lineHeight: 17, textAlign: 'right', marginTop: 2 },
  leaderboard: { backgroundColor: THEME.surface, borderRadius: 20, borderWidth: 1, borderColor: THEME.line, paddingHorizontal: 13, marginBottom: 18 },
  leaderRow: { minHeight: 52, flexDirection: 'row-reverse', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.line, gap: 9 },
  leaderRowLast: { borderBottomWidth: 0 },
  leaderRank: { width: 22, fontFamily: FONT, color: THEME.primary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  leaderEmoji: { fontSize: 22 },
  leaderName: { flex: 1, fontFamily: FONT, color: THEME.ink, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  leaderPoints: { fontFamily: FONT, color: THEME.muted, fontSize: 10 },
  badgeRow: { flexDirection: 'row-reverse', gap: 9, marginBottom: 18 },
  badgeCard: { flex: 1, backgroundColor: THEME.surface, borderRadius: 16, borderWidth: 1, borderColor: THEME.line, alignItems: 'center', paddingVertical: 12 },
  badgeEmoji: { fontSize: 27 },
  badgeLabel: { fontFamily: FONT, color: THEME.muted, fontSize: 10, textAlign: 'center', marginTop: 6 },
  commentCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 20, padding: 13, borderWidth: 1, borderColor: THEME.line },
  commentEmoji: { fontSize: 23 },
  commentMain: { flex: 1, alignItems: 'flex-end', marginHorizontal: 9 },
  commentName: { fontFamily: FONT, color: THEME.ink, fontSize: 12, fontWeight: '800' },
  commentText: { fontFamily: FONT, color: THEME.muted, fontSize: 11, marginTop: 3, textAlign: 'right' },
  commentTime: { fontFamily: FONT, color: THEME.faint, fontSize: 9 },
  commentInput: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 15, borderWidth: 1, borderColor: THEME.line, paddingHorizontal: 10, marginTop: 8 },
  commentTextInput: { flex: 1, fontFamily: FONT, color: THEME.ink, fontSize: 11, minHeight: 43 },
  profileCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: THEME.line, marginBottom: 21 },
  profileAvatar: { width: 53, height: 53, borderRadius: 20, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 28 },
  profileMain: { flex: 1, alignItems: 'flex-end', marginHorizontal: 11 },
  profileName: { fontFamily: FONT, color: THEME.ink, fontSize: 17, fontWeight: '900' },
  profileMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 11, marginTop: 3 },
  settingsCard: { backgroundColor: THEME.surface, borderRadius: 20, borderWidth: 1, borderColor: THEME.line, paddingHorizontal: 13, marginBottom: 19 },
  settingRow: { minHeight: 65, flexDirection: 'row-reverse', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.line, gap: 10 },
  settingRowLast: { borderBottomWidth: 0 },
  settingIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  settingIconText: { fontSize: 18 },
  settingMain: { flex: 1, alignItems: 'flex-end' },
  settingTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  settingSub: { fontFamily: FONT, color: THEME.muted, fontSize: 10, marginTop: 3, textAlign: 'right' },
  switch: { width: 43, height: 25, borderRadius: 13, backgroundColor: '#D9DCE6', padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: THEME.primary },
  switchKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  switchKnobOn: { alignSelf: 'flex-end' },
  resetRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14 },
  resetText: { fontFamily: FONT, color: THEME.danger, fontSize: 12, fontWeight: '700' },
  versionText: { fontFamily: FONT, color: THEME.faint, fontSize: 10, textAlign: 'center', marginTop: 2 },
  bottomNav: { position: 'absolute', left: 14, right: 14, bottom: 12, minHeight: 70, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: THEME.line, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 5, shadowColor: '#14151F', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navItemActive: {},
  navIcon: { width: 34, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: THEME.primarySoft },
  navLabel: { fontFamily: FONT, color: THEME.muted, fontSize: 10 },
  navLabelActive: { color: THEME.primary, fontWeight: '800' },
  button: { minHeight: 43, borderRadius: 14, backgroundColor: THEME.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 15 },
  buttonSecondary: { backgroundColor: THEME.primarySoft },
  buttonGhost: { minHeight: 35, backgroundColor: 'transparent', paddingHorizontal: 7 },
  buttonDanger: { backgroundColor: THEME.dangerSoft },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { fontFamily: FONT, color: '#fff', fontSize: 12, fontWeight: '800' },
  buttonTextDark: { color: THEME.primary },
  pressed: { opacity: 0.75 },
  emptyState: { alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.surface, borderRadius: 20, borderWidth: 1, borderColor: THEME.line, padding: 25, marginVertical: 9 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontFamily: FONT, color: THEME.muted, fontSize: 11, lineHeight: 20, textAlign: 'center', marginTop: 5, marginBottom: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(22,20,38,0.48)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '91%', backgroundColor: THEME.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 9, paddingBottom: Platform.OS === 'ios' ? 28 : 18 },
  modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D0D2DD', alignSelf: 'center', marginBottom: 13 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 18, fontWeight: '900' },
  closeButton: { width: 35, height: 35, borderRadius: 12, backgroundColor: THEME.surface, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 48, backgroundColor: THEME.surface, borderRadius: 14, borderWidth: 1, borderColor: THEME.line, paddingHorizontal: 13, fontFamily: FONT, color: THEME.ink, fontSize: 13, marginBottom: 10 },
  formRow: { flexDirection: 'row-reverse', gap: 8 },
  smallInput: { flex: 1 },
  priceInput: { flex: 1.6 },
  fieldLabel: { fontFamily: FONT, color: THEME.ink, fontSize: 12, fontWeight: '800', textAlign: 'right', marginTop: 7, marginBottom: 8 },
  choiceRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7, marginBottom: 5 },
  horizontalChoices: { flexDirection: 'row', gap: 7, paddingBottom: 5 },
  authRow: { flexDirection: 'row-reverse', gap: 7, marginBottom: 2 },
  authButton: { flex: 1, minHeight: 52, borderRadius: 14, backgroundColor: THEME.background, borderWidth: 1, borderColor: THEME.line, alignItems: 'center', justifyContent: 'center', gap: 2 },
  authButtonActive: { backgroundColor: THEME.primarySoft, borderColor: '#D1CCFF' },
  authEmoji: { fontFamily: FONT, color: THEME.primary, fontSize: 17, fontWeight: '800' },
  authButtonText: { fontFamily: FONT, color: THEME.muted, fontSize: 10 },
  authButtonTextActive: { color: THEME.primary, fontWeight: '800' },
  optionalHint: { fontFamily: FONT, color: THEME.faint, fontSize: 9, lineHeight: 17, textAlign: 'right', marginBottom: 4 },
  inviteRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginBottom: 2 },
  inviteInput: { flex: 1, minHeight: 45, backgroundColor: THEME.surface, borderRadius: 13, borderWidth: 1, borderColor: THEME.line, paddingHorizontal: 11, fontFamily: FONT, color: THEME.ink, fontSize: 11 },
  inviteButton: { minHeight: 45, borderRadius: 13, backgroundColor: THEME.primarySoft, flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  inviteButtonText: { fontFamily: FONT, color: THEME.primary, fontSize: 11, fontWeight: '800' },
  continueButton: { marginTop: 20, minHeight: 50 },
  skipButton: { alignItems: 'center', paddingVertical: 13 },
  skipText: { fontFamily: FONT, color: THEME.muted, fontSize: 11 },
  onboarding: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 },
  brandMark: { width: 78, height: 78, borderRadius: 26, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { fontSize: 39 },
  brandName: { fontFamily: FONT, color: THEME.ink, fontSize: 30, fontWeight: '900', marginTop: 14 },
  brandTagline: { fontFamily: FONT, color: THEME.muted, fontSize: 13, marginTop: 4, textAlign: 'center' },
  onboardingCard: { width: '100%', maxWidth: 520, backgroundColor: THEME.surface, borderRadius: 26, padding: 20, marginTop: 26, borderWidth: 1, borderColor: THEME.line },
  onboardingTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  onboardingText: { fontFamily: FONT, color: THEME.muted, fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 11 },
  onboardingFoot: { fontFamily: FONT, color: THEME.faint, fontSize: 10, marginTop: 22 },
  entryTabs: { flexDirection: 'row-reverse', backgroundColor: '#EDEEF5', borderRadius: 15, padding: 4, marginBottom: 15 },
  entryTab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 53, borderRadius: 12, gap: 3 },
  entryTabActive: { backgroundColor: THEME.surface },
  entryTabText: { fontFamily: FONT, color: THEME.muted, fontSize: 10 },
  entryTabTextActive: { color: THEME.primary, fontWeight: '800' },
  capturePanel: { alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 20, padding: 21, borderWidth: 1, borderColor: THEME.line, marginBottom: 12 },
  captureIcon: { width: 72, height: 72, borderRadius: 26, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  captureTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 16, fontWeight: '900' },
  captureText: { fontFamily: FONT, color: THEME.muted, fontSize: 11, textAlign: 'center', lineHeight: 19, marginTop: 5, marginBottom: 13 },
  infoBanner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: THEME.primarySoft, borderRadius: 13, padding: 10, marginBottom: 10 },
  infoBannerText: { flex: 1, fontFamily: FONT, color: THEME.primaryDark, fontSize: 10, lineHeight: 18, textAlign: 'right' },
  modalPrimaryButton: { minHeight: 48, marginTop: 14, marginBottom: 11 },
  recentLabel: { fontFamily: FONT, color: THEME.muted, fontSize: 11, textAlign: 'right', marginTop: 3, marginBottom: 6 },
  emojiGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  emojiChoice: { width: 43, height: 43, borderRadius: 14, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, alignItems: 'center', justifyContent: 'center' },
  emojiChoiceActive: { backgroundColor: THEME.primarySoft, borderColor: THEME.primary },
  emojiChoiceText: { fontSize: 23 },
  menuGrid: { gap: 8, paddingBottom: 10 },
  menuItem: { minHeight: 56, backgroundColor: THEME.surface, borderRadius: 16, paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  menuIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { flex: 1, fontFamily: FONT, color: THEME.ink, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  addInlineButton: { alignSelf: 'flex-end', marginBottom: 10 },
  managerList: { maxHeight: 300 },
  managerRow: { minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 14, paddingHorizontal: 10, marginBottom: 7 },
  managerEmoji: { fontSize: 21 },
  managerName: { flex: 1, fontFamily: FONT, color: THEME.ink, fontSize: 13, textAlign: 'right', marginHorizontal: 9 },
  historyRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 15, padding: 11, marginBottom: 8 },
  historyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  historyMain: { flex: 1, alignItems: 'flex-end', marginHorizontal: 9 },
  historyName: { fontFamily: FONT, color: THEME.ink, fontSize: 12, fontWeight: '800' },
  historyMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 10, marginTop: 3 },
  historyTotal: { fontFamily: FONT, color: THEME.primary, fontSize: 11, fontWeight: '800' },
  contactBrand: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.primarySoft, borderRadius: 20, padding: 13, marginBottom: 10 },
  brandMini: { width: 42, height: 42, borderRadius: 14, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  brandMiniText: { color: '#fff', fontFamily: FONT, fontSize: 22, fontWeight: '900' },
  contactName: { fontFamily: FONT, color: THEME.ink, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  contactSub: { fontFamily: FONT, color: THEME.muted, fontSize: 10, marginTop: 2, textAlign: 'right' },
  contactMain: { flex: 1, alignItems: 'flex-end', marginHorizontal: 9 },
  contactRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 15, padding: 12, marginBottom: 8 },
  contactEmoji: { fontSize: 21 },
  contactLabel: { fontFamily: FONT, color: THEME.ink, fontSize: 12, fontWeight: '800' },
  contactValue: { fontFamily: FONT, color: THEME.muted, fontSize: 10, marginTop: 2 },
  choiceList: { paddingBottom: 8 },
  choiceListRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.surface, borderRadius: 14, paddingHorizontal: 13, marginBottom: 7 },
  choiceListText: { fontFamily: FONT, color: THEME.ink, fontSize: 13, textAlign: 'right' },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: '#C8CBD8', alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
});

export default App;
