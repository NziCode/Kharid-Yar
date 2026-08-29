import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { createClient } from '@supabase/supabase-js';
import './web-fonts.css';

/*
 * KharidYar / خریدیار — a focused, offline-first shopping list app.
 * Bilingual (Persian/RTL + English/LTR). No demo/fake features: every
 * screen here does exactly what it appears to do.
 */

const FONT = 'Vazirmatn';
const STORAGE_KEY = 'kharidyar-state-v5';

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
};

// ---------------------------------------------------------------------------
// Translations. Every user-facing string lives here — no hardcoded text
// elsewhere — so language switching is complete and consistent.
// ---------------------------------------------------------------------------
const STRINGS = {
  fa: {
    dir: 'rtl',
    appName: 'خریدیار',
    tagline: 'خریدهای روزمره، ساده‌تر و هوشمندتر',
    welcomeTitle: 'خوش آمدی',
    welcomeSubtitle: 'برای شروع، اسمت رو وارد کن.',
    nameLabel: 'اسمت را چطور صدا بزنیم؟',
    namePlaceholder: 'مثلاً محمد علی',
    languageLabel: 'زبان برنامه',
    currencyLabel: 'واحد پول',
    continueButton: 'شروع کنیم',
    onboardingFoot: 'ساخته‌شده با ❤ توسط NziCode',
    greeting: (name) => `سلام ${name}`,
    homeSubtitle: 'امروز چه چیزی لازم داری؟',
    statLists: 'لیست فعال',
    statOpenItems: 'قلم باز',
    activeLists: 'لیست‌های فعال',
    seeAll: 'مشاهده همه',
    newList: 'لیست جدید',
    newListSub: 'خانه، شرکت، مهمانی…',
    emptyListsTitle: 'اولین لیستت را بساز',
    previousLists: 'لیست‌های قبلی',
    previousListsSub: (n) => n ? `${n} خرید ذخیره شده` : 'هنوز خریدی ثبت نشده است',
    view: 'مشاهده',
    myLists: 'لیست‌های من',
    activeCount: (n) => `${n} لیست فعال`,
    searchLists: 'جست‌وجوی لیست‌ها',
    noListsTitle: 'لیستی نداری',
    noListsText: 'برای خانه، شرکت یا مهمانی یک لیست بساز.',
    createList: 'ساخت لیست',
    listNameLabel: 'نام لیست',
    listNamePlaceholder: 'مثلاً خرید ماهانه',
    listIconLabel: 'آیکون لیست',
    itemsCount: (n) => `${n} قلم`,
    doneOf: (done, total) => `${done} از ${total} انجام شد`,
    emptyAndReady: 'لیست خالی و آماده‌ی شروع',
    membersCount: (n) => `${n}`,
    addItemPlaceholder: 'کالا یا یادداشت جدید اضافه کن…',
    searchItems: 'جست‌وجوی کالا',
    allCategories: 'همه',
    manage: 'مدیریت',
    emptyDetailTitle: 'این لیست هنوز خالی است',
    emptyDetailText: 'با افزودن یک کالا شروع کن؛ خریدیار بقیه را مرتب می‌کند.',
    addItem: 'افزودن کالا',
    finishShopping: 'پایان خرید',
    finishConfirmTitle: 'پایان خرید',
    finishConfirmText: 'این لیست به «لیست‌های قبلی» منتقل و خالی می‌شود.',
    confirm: 'تایید',
    cancel: 'انصراف',
    addItemTitle: 'افزودن کالا',
    tabManual: 'دستی',
    tabVoice: 'صدا',
    itemNamePlaceholder: 'نام کالا، مثلاً نان سنگک',
    quantityPlaceholder: 'تعداد',
    categoryLabel: 'دسته‌بندی پیشنهادی',
    addToList: 'افزودن به لیست',
    recentItems: 'آخرین کالاها',
    voiceIdle: 'برای شروع، دکمه‌ی میکروفون را بزن و نام کالا را بگو.',
    voiceListening: 'در حال شنیدن… الان بگو',
    voiceStart: 'شروع گفتن',
    voiceStop: 'توقف',
    voiceUnsupported: 'تشخیص صدا در این مرورگر پشتیبانی نمی‌شود.',
    voiceDenied: 'دسترسی به میکروفون رد شد.',
    voiceError: 'صدا شناسایی نشد، دوباره تلاش کن.',
    voiceHeard: (text) => `شنیده شد: «${text}»`,
    nameRequired: 'نام کالا را وارد کن.',
    newCategoryTitle: 'دسته‌بندی جدید',
    categoryNamePlaceholder: 'مثلاً لوازم کودک',
    chooseIcon: 'انتخاب آیکون',
    addCategory: 'افزودن دسته‌بندی',
    manageCategoriesTitle: 'مدیریت دسته‌بندی‌ها',
    newCategory: 'دسته‌بندی جدید',
    previousListsTitle: 'لیست‌های قبلی',
    previousListsEmptyTitle: 'هنوز سابقه‌ای نیست',
    previousListsEmptyText: 'وقتی خریدی را تمام کنی، اینجا ذخیره می‌شود.',
    restoreList: 'بازسازی لیست',
    deleteHistory: 'حذف از تاریخچه',
    profileTitle: 'پروفایل و تنظیمات',
    profileSubtitle: 'کنترل خریدیار در دستان تو',
    memberOf: 'عضو خریدیار · NziCode',
    editProfile: 'ویرایش پروفایل',
    preferences: 'ترجیحات',
    notifications: 'اعلان‌ها',
    notificationsSubOn: 'فعال — یادآوری خرید ارسال می‌شود',
    notificationsSubOff: 'غیرفعال است',
    notificationsUnsupported: 'اعلان‌ها روی این دستگاه پشتیبانی نمی‌شود.',
    notificationsDenied: 'اجازه‌ی اعلان داده نشد.',
    offlineNotice: 'همه‌ی اطلاعات فقط روی همین دستگاه ذخیره می‌شود؛ این اپ نیازی به اینترنت ندارد.',
    tools: 'ابزارها',
    backup: 'پشتیبان‌گیری',
    backupSub: 'خروجی JSON از لیست‌ها و تنظیمات',
    backupDone: 'فایل پشتیبان دانلود شد.',
    backupFailed: 'ساخت فایل پشتیبان انجام نشد؛ دوباره تلاش کن.',
    contact: 'ارتباط با ما',
    contactSub: 'پشتیبانی توسط NziCode',
    resetData: 'پاک‌کردن اطلاعات محلی',
    resetConfirmTitle: 'پاک‌کردن داده‌ها',
    resetConfirmText: 'همه‌ی اطلاعات محلی پاک شود؟',
    resetConfirmButton: 'پاک کن',
    version: 'خریدیار ۱.۰ · طراحی و توسعه NziCode',
    save: 'ذخیره',
    contactWhatsapp: 'واتساپ',
    contactTelegram: 'تلگرام',
    contactEmail: 'ایمیل',
    toman: 'تومان',
    rial: 'ریال',
    farsi: 'فارسی',
    english: 'English',
    categories: {
      dairy: 'لبنیات', produce: 'میوه و سبزی', protein: 'پروتئینی',
      pantry: 'خواربار', cleaning: 'شوینده', snacks: 'تنقلات', other: 'سایر',
    },
    listShareText: (name, lines) => `${name}\n${lines || 'هنوز کالایی اضافه نشده است.'}`,
    share: 'اشتراک‌گذاری',
    shareList: 'اشتراک‌گذاری لیست با دیگران',
    joinList: 'عضویت در لیست مشترک',
    joinListSub: 'با یه کد ۶ رقمی به لیست دوستات وصل شو',
    enterCode: 'کد اشتراک را وارد کن',
    joinButton: 'عضو شو',
    codeInvalid: 'این کد پیدا نشد. کد را دوباره چک کن.',
    codeRequired: 'کد ۶ رقمی را وارد کن.',
    sharing: 'در حال اشتراک‌گذاری…',
    joining: 'در حال اتصال…',
    shareCreated: (code) => `لیست مشترک شد! کد: ${code}`,
    shareMessage: (name, code) => `بیا با هم لیست «${name}» رو تو خریدیار مدیریت کنیم!\n\nکد اشتراک: ${code}\n\n۱. اپ خریدیار رو باز کن\n۲. برو به «لیست‌ها» → «عضویت در لیست مشترک»\n۳. کد بالا رو وارد کن`,
    sharedBadge: 'مشترک',
    sharedMembers: 'اعضای این لیست، لحظه‌ای تغییرات هم رو می‌بینن',
    shareError: 'اشتراک‌گذاری انجام نشد. اتصال اینترنت را چک کن.',
    alreadyShared: 'این لیست از قبل مشترک است',
    shareCodeLabel: 'کد اشتراک این لیست',
    copyCode: 'کپی کد',
    codeCopied: 'کد کپی شد',
  },
  en: {
    dir: 'ltr',
    appName: 'KharidYar',
    tagline: 'Everyday shopping, simpler and smarter',
    welcomeTitle: 'Welcome',
    welcomeSubtitle: "Let's start with your name.",
    nameLabel: 'What should we call you?',
    namePlaceholder: 'e.g. Sara',
    languageLabel: 'App language',
    currencyLabel: 'Currency',
    continueButton: "Let's go",
    onboardingFoot: 'Made with ❤ by NziCode',
    greeting: (name) => `Hi ${name}`,
    homeSubtitle: 'What do you need today?',
    statLists: 'active lists',
    statOpenItems: 'open items',
    activeLists: 'Active lists',
    seeAll: 'See all',
    newList: 'New list',
    newListSub: 'Home, work, party…',
    emptyListsTitle: 'Create your first list',
    previousLists: 'Previous lists',
    previousListsSub: (n) => n ? `${n} trips saved` : 'No trips saved yet',
    view: 'View',
    myLists: 'My Lists',
    activeCount: (n) => `${n} active`,
    searchLists: 'Search lists',
    noListsTitle: "You don't have any lists",
    noListsText: 'Create a list for home, work, or a party.',
    createList: 'Create list',
    listNameLabel: 'List name',
    listNamePlaceholder: 'e.g. Monthly shopping',
    listIconLabel: 'List icon',
    itemsCount: (n) => `${n} items`,
    doneOf: (done, total) => `${done} of ${total} done`,
    emptyAndReady: 'Empty list, ready to go',
    membersCount: (n) => `${n}`,
    addItemPlaceholder: 'Add a new item or note…',
    searchItems: 'Search items',
    allCategories: 'All',
    manage: 'Manage',
    emptyDetailTitle: 'This list is still empty',
    emptyDetailText: 'Add an item to get started — KharidYar sorts the rest.',
    addItem: 'Add item',
    finishShopping: 'Finish shopping',
    finishConfirmTitle: 'Finish shopping',
    finishConfirmText: 'This list will move to Previous Lists and be cleared.',
    confirm: 'Confirm',
    cancel: 'Cancel',
    addItemTitle: 'Add item',
    tabManual: 'Type',
    tabVoice: 'Voice',
    itemNamePlaceholder: 'Item name, e.g. Bread',
    quantityPlaceholder: 'Quantity',
    categoryLabel: 'Suggested category',
    addToList: 'Add to list',
    recentItems: 'Recent items',
    voiceIdle: 'Tap the microphone and say the item name.',
    voiceListening: 'Listening… speak now',
    voiceStart: 'Start speaking',
    voiceStop: 'Stop',
    voiceUnsupported: 'Voice recognition is not supported in this browser.',
    voiceDenied: 'Microphone access was denied.',
    voiceError: "Didn't catch that — try again.",
    voiceHeard: (text) => `Heard: "${text}"`,
    nameRequired: 'Enter an item name.',
    newCategoryTitle: 'New category',
    categoryNamePlaceholder: 'e.g. Baby supplies',
    chooseIcon: 'Choose an icon',
    addCategory: 'Add category',
    manageCategoriesTitle: 'Manage categories',
    newCategory: 'New category',
    previousListsTitle: 'Previous lists',
    previousListsEmptyTitle: 'No history yet',
    previousListsEmptyText: "It'll show up here once you finish a trip.",
    restoreList: 'Restore list',
    deleteHistory: 'Remove from history',
    profileTitle: 'Profile & settings',
    profileSubtitle: 'KharidYar, in your control',
    memberOf: 'KharidYar member · NziCode',
    editProfile: 'Edit profile',
    preferences: 'Preferences',
    notifications: 'Notifications',
    notificationsSubOn: 'On — shopping reminders enabled',
    notificationsSubOff: 'Off',
    notificationsUnsupported: 'Notifications are not supported on this device.',
    notificationsDenied: 'Notification permission was denied.',
    offlineNotice: 'All data is stored only on this device; this app needs no internet connection.',
    tools: 'Tools',
    backup: 'Backup',
    backupSub: 'Export lists & settings as JSON',
    backupDone: 'Backup file downloaded.',
    backupFailed: 'Could not create the backup — try again.',
    contact: 'Contact us',
    contactSub: 'Support by NziCode',
    resetData: 'Clear local data',
    resetConfirmTitle: 'Clear data',
    resetConfirmText: 'Delete all local data?',
    resetConfirmButton: 'Delete',
    version: 'KharidYar 1.0 · Designed by NziCode',
    save: 'Save',
    contactWhatsapp: 'WhatsApp',
    contactTelegram: 'Telegram',
    contactEmail: 'Email',
    toman: 'Toman',
    rial: 'Rial',
    farsi: 'فارسی',
    english: 'English',
    categories: {
      dairy: 'Dairy', produce: 'Produce', protein: 'Protein',
      pantry: 'Pantry staples', cleaning: 'Cleaning', snacks: 'Snacks', other: 'Other',
    },
    listShareText: (name, lines) => `${name}\n${lines || 'No items yet.'}`,
    share: 'Share',
    shareList: 'Share list with others',
    joinList: 'Join a shared list',
    joinListSub: "Connect to a friend's list with a 6-character code",
    enterCode: 'Enter the share code',
    joinButton: 'Join',
    codeInvalid: "Couldn't find that code. Double-check it.",
    codeRequired: 'Enter the 6-character code.',
    sharing: 'Sharing…',
    joining: 'Connecting…',
    shareCreated: (code) => `List shared! Code: ${code}`,
    shareMessage: (name, code) => `Let's manage the "${name}" list together on KharidYar!\n\nShare code: ${code}\n\n1. Open KharidYar\n2. Go to Lists → "Join a shared list"\n3. Enter the code above`,
    sharedBadge: 'Shared',
    sharedMembers: 'Members of this list see changes instantly',
    shareError: 'Could not share the list. Check your connection.',
    alreadyShared: 'This list is already shared',
    shareCodeLabel: 'This list\'s share code',
    copyCode: 'Copy code',
    codeCopied: 'Code copied',
  },
};

const DEFAULT_CATEGORIES = [
  { id: 'dairy', icon: 'cheese' },
  { id: 'produce', icon: 'carrot' },
  { id: 'protein', icon: 'drumstick-bite' },
  { id: 'pantry', icon: 'wheat-awn' },
  { id: 'cleaning', icon: 'soap' },
  { id: 'snacks', icon: 'cookie-bite' },
  { id: 'other', icon: 'box' },
];

const LIST_ICON_CHOICES = ['house', 'cart-shopping', 'champagne-glasses', 'wrench', 'building', 'basket-shopping', 'bag-shopping', 'utensils'];
const CATEGORY_ICON_CHOICES = ['bone', 'pump-soap', 'paw', 'book', 'leaf', 'gift', 'toolbox', 'box'];

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

const normalizeItem = (item) => ({
  id: item.id || makeId('item'),
  name: item.name || '',
  category: item.category || 'other',
  quantity: item.quantity || '1',
  done: Boolean(item.done),
  createdAt: item.createdAt || Date.now(),
});

const normalizeList = (list, index) => ({
  id: list.id || makeId('list'),
  name: list.name || `List ${index + 1}`,
  icon: list.icon || LIST_ICON_CHOICES[index % LIST_ICON_CHOICES.length],
  updatedAt: list.updatedAt || Date.now(),
  items: Array.isArray(list.items) ? list.items.map(normalizeItem) : [],
});

const createEmptyState = () => ({
  version: 5,
  onboardingDone: false,
  userName: '',
  language: 'fa',
  currency: 'toman',
  notifications: false,
  lists: [{ id: 'home', name: '', icon: 'house', updatedAt: Date.now(), items: [] }],
  categories: DEFAULT_CATEGORIES,
  history: [],
});

const normalizeState = (saved) => {
  const fallback = createEmptyState();
  if (!saved || typeof saved !== 'object') return fallback;
  const oldLists = Array.isArray(saved.lists) ? saved.lists : [];
  const lists = oldLists.length ? oldLists.map(normalizeList) : fallback.lists;
  const categories = Array.isArray(saved.categories) && saved.categories.length
    ? saved.categories.map((category) => ({
      id: category.id || makeId('cat'),
      label: category.label,
      icon: category.icon || category.emoji || 'box',
    }))
    : fallback.categories;
  return {
    ...fallback,
    ...saved,
    version: 5,
    onboardingDone: Boolean(saved.onboardingDone || saved.userName),
    userName: saved.userName || '',
    language: saved.language === 'en' ? 'en' : 'fa',
    currency: saved.currency === 'rial' ? 'rial' : 'toman',
    notifications: Boolean(saved.notifications),
    lists,
    categories,
    history: Array.isArray(saved.history) ? saved.history : [],
  };
};

const loadInitialState = () => {
  const saved = readStorage(STORAGE_KEY);
  if (saved) return normalizeState(saved);
  return createEmptyState();
};

const categoryLabel = (t, category) => category.label || t.categories[category.id] || category.id;

// ---------------------------------------------------------------------------
// Icon — central registry mapping short names to FontAwesome6 icons.
// Direction-sensitive entries (back/forward) flip automatically with isRTL.
// ---------------------------------------------------------------------------
const Icon = ({ name, size = 21, color = THEME.ink, isRTL = true, style }) => {
  const names = {
    menu: 'bars',
    back: isRTL ? 'chevron-right' : 'chevron-left',
    forward: isRTL ? 'chevron-left' : 'chevron-right',
    home: 'house',
    list: 'list-ul',
    profile: 'user',
    plus: 'plus',
    search: 'magnifying-glass',
    share: 'share-nodes',
    more: 'ellipsis',
    check: 'check',
    close: 'xmark',
    mic: 'microphone',
    micOff: 'microphone-slash',
    trash: 'trash',
    edit: 'pen',
    bell: 'bell',
    clock: 'clock',
    history: 'clock-rotate-left',
    money: 'money-bill',
    globe: 'globe',
    cart: 'cart-shopping',
    envelope: 'envelope',
    whatsapp: 'whatsapp',
    telegram: 'telegram',
    users: 'users',
    sliders: 'sliders',
  };
  return <FontAwesome6 name={names[name] || 'circle'} size={size * 0.86} color={color} style={style} />;
};

// Renders a data-driven icon (category/list icons are stored as FA6 names).
const Glyph = ({ value, size = 20, color = THEME.ink, style }) => (
  <FontAwesome6 name={value || 'box'} size={size} color={color} style={style} />
);

// ---------------------------------------------------------------------------
// Voice recognition — uses the browser's native SpeechRecognition API
// (available in Chrome / Android System WebView with RECORD_AUDIO granted).
// ---------------------------------------------------------------------------
const useVoiceRecognition = () => {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const supported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = (lang, onResult, onError) => {
    if (!supported) {
      onError && onError('unsupported');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = lang === 'en' ? 'en-US' : 'fa-IR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      onResult(text);
    };
    recognition.onerror = (event) => {
      onError && onError(event.error || 'error');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      onError && onError('error');
    }
  };

  const stop = () => {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    setListening(false);
  };

  return { supported, listening, start, stop };
};

// ---------------------------------------------------------------------------
// Local notifications — uses the standard browser Notification API. This
// runs correctly in real browsers and in the Android System WebView that
// Capacitor wraps the app in (unlike the @capacitor/local-notifications
// plugin, which does not bundle through this project's Metro/Expo-web
// export pipeline). Every call is guarded so unsupported environments just
// report back cleanly instead of throwing.
// ---------------------------------------------------------------------------
const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

const requestNotifications = async (title, body) => {
  if (!notificationsSupported()) return { ok: false, reason: 'unsupported' };
  try {
    let permission = window.Notification.permission;
    if (permission === 'default') {
      permission = await window.Notification.requestPermission();
    }
    if (permission !== 'granted') return { ok: false, reason: 'denied' };
    new window.Notification(title, { body });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unsupported' };
  }
};

const cancelNotifications = async () => {
  // The standard Notification API has no persistent "scheduled"
  // notification to cancel — disabling the toggle simply stops future ones.
};

// ---------------------------------------------------------------------------
// Shared lists — realtime multi-person lists via Supabase. No accounts: the
// 6-character share code IS the access key (same trust model as a shared
// document link). A list only ever touches the network once the person
// explicitly shares or joins it; personal lists stay fully offline as before.
// ---------------------------------------------------------------------------
const SUPABASE_URL = 'https://oisvrsfuuyrpifkdlddd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EVRf-xFoHjDjnQhU0jnr5w_cu7gxkG7';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Avoids visually-confusing characters (0/O, 1/I/l) since people will read
// this code aloud or type it in by hand.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generateShareCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');

const fetchSharedList = async (code) => {
  const { data: listRow, error: listError } = await supabase.from('shared_lists').select('*').eq('id', code).maybeSingle();
  if (listError || !listRow) return null;
  const { data: itemRows } = await supabase.from('shared_items').select('*').eq('list_id', code).order('created_at', { ascending: true });
  return {
    id: listRow.id,
    name: listRow.name,
    icon: listRow.icon,
    shared: true,
    updatedAt: new Date(listRow.updated_at).getTime(),
    items: (itemRows || []).map((row) => ({
      id: row.id, name: row.name, category: row.category, quantity: row.quantity, done: row.done, createdAt: new Date(row.created_at).getTime(),
    })),
  };
};

const pushListToSupabase = async (list, code) => {
  await supabase.from('shared_lists').insert({ id: code, name: list.name || 'Shared list', icon: list.icon });
  if (list.items.length) {
    await supabase.from('shared_items').insert(list.items.map((item) => ({
      id: item.id, list_id: code, name: item.name, category: item.category, quantity: item.quantity, done: item.done,
    })));
  }
};

// ---------------------------------------------------------------------------
// Styles — built as a function of direction so the whole app mirrors
// correctly between Persian (RTL) and English (LTR).
// ---------------------------------------------------------------------------
const createStyles = (isRTL) => {
  const row = isRTL ? 'row-reverse' : 'row';
  const align = isRTL ? 'right' : 'left';
  return StyleSheet.create({
    appShell: { flex: 1, backgroundColor: THEME.background },
    appBody: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
    content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 105 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.background },
    loadingText: { fontFamily: FONT, color: THEME.muted, fontSize: 15, marginTop: 10 },

    // Onboarding
    onboarding: { flexGrow: 1, alignItems: 'center', paddingTop: 50, paddingBottom: 40 },
    brandMark: { width: 78, height: 78, borderRadius: 26, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
    brandName: { fontFamily: FONT, fontSize: 26, fontWeight: '800', color: THEME.ink, marginTop: 16 },
    brandTagline: { fontFamily: FONT, fontSize: 13, color: THEME.muted, marginTop: 4, marginBottom: 26 },
    onboardingCard: { width: '100%', backgroundColor: THEME.surface, borderRadius: 20, borderWidth: 1, borderColor: THEME.line, padding: 20 },
    onboardingTitle: { fontFamily: FONT, fontSize: 19, fontWeight: '800', color: THEME.ink, textAlign: align },
    onboardingText: { fontFamily: FONT, fontSize: 13, color: THEME.muted, textAlign: align, marginTop: 4, marginBottom: 16 },
    fieldLabel: { fontFamily: FONT, fontSize: 13, fontWeight: '700', color: THEME.ink, textAlign: align, marginTop: 14, marginBottom: 8 },
    input: { fontFamily: FONT, fontSize: 14, color: THEME.ink, textAlign: align, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surface, paddingHorizontal: 15 },
    choiceRow: { flexDirection: row, gap: 8, flexWrap: 'wrap' },
    continueButton: { marginTop: 24 },
    onboardingFoot: { fontFamily: FONT, fontSize: 12, color: THEME.faint, marginTop: 22 },

    // Shared primitives
    button: { minHeight: 50, borderRadius: 16, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center', flexDirection: row, gap: 8, paddingHorizontal: 18 },
    buttonSecondary: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line },
    buttonGhost: { backgroundColor: 'transparent' },
    buttonDanger: { backgroundColor: THEME.dangerSoft },
    buttonDisabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
    buttonText: { fontFamily: FONT, fontSize: 15, fontWeight: '700', color: '#fff' },
    buttonTextDark: { color: THEME.primary },

    pill: { flexDirection: row, alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line },
    pillActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    pillText: { fontFamily: FONT, fontSize: 13, fontWeight: '700', color: THEME.ink },
    pillTextActive: { color: '#fff' },

    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, marginTop: 4 },
    sectionTitle: { fontFamily: FONT, color: THEME.ink, fontSize: 17, fontWeight: '800', textAlign: align },
    sectionAction: { flexDirection: row, alignItems: 'center', gap: 3 },
    sectionActionText: { fontFamily: FONT, color: THEME.primary, fontSize: 13, fontWeight: '700' },

    progressTrack: { height: 6, borderRadius: 3, backgroundColor: THEME.line, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },

    screenHeader: { flexDirection: row, alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
    headerLeading: { flexDirection: row, alignItems: 'center', gap: 7, flex: 1 },
    screenTitle: { fontFamily: FONT, fontSize: 19, fontWeight: '800', color: THEME.ink, textAlign: align },
    screenSubtitle: { fontFamily: FONT, fontSize: 12, color: THEME.muted, marginTop: 2, textAlign: align },
    iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    roundPrimary: { width: 42, height: 42, borderRadius: 20, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,21,31,0.45)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: THEME.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30, maxHeight: '88%' },
    modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D0D2DD', alignSelf: 'center', marginBottom: 13 },
    modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    modalTitle: { fontFamily: FONT, fontSize: 18, fontWeight: '800', color: THEME.ink },
    closeButton: { width: 35, height: 35, borderRadius: 12, backgroundColor: THEME.surfaceAlt || '#F3F3F8', alignItems: 'center', justifyContent: 'center' },
    modalPrimaryButton: { marginTop: 16 },

    emptyState: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 20 },
    emptyIcon: { marginBottom: 10 },
    emptyTitle: { fontFamily: FONT, fontSize: 16, fontWeight: '800', color: THEME.ink, textAlign: 'center' },
    emptyText: { fontFamily: FONT, fontSize: 13, color: THEME.muted, textAlign: 'center', marginTop: 6, marginBottom: 16, lineHeight: 20 },

    // Home
    homeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    homeTopLeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    greeting: {},
    greetingText: { fontFamily: FONT, fontSize: 22, fontWeight: '800', color: THEME.ink, textAlign: align },
    greetingSub: { fontFamily: FONT, fontSize: 13, color: THEME.muted, marginTop: 2, textAlign: align },
    avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },

    statsRow: { flexDirection: row, gap: 10, marginBottom: 18 },
    statCard: { flex: 1, backgroundColor: THEME.surface, borderRadius: 16, borderWidth: 1, borderColor: THEME.line, padding: 14, alignItems: isRTL ? 'flex-end' : 'flex-start' },
    statNumber: { fontFamily: FONT, fontSize: 22, fontWeight: '800', color: THEME.primary },
    statLabel: { fontFamily: FONT, fontSize: 12, color: THEME.muted, marginTop: 2 },

    horizontalCards: { flexDirection: 'row', gap: 12, paddingBottom: 7 },
    listCard: { width: 168, backgroundColor: THEME.surface, borderRadius: 20, borderWidth: 1, borderColor: THEME.line, padding: 15 },
    listCardTop: { flexDirection: row, justifyContent: 'space-between', alignItems: 'center' },
    listName: { fontFamily: FONT, fontSize: 15, fontWeight: '800', color: THEME.ink, marginTop: 10, textAlign: align },
    listMeta: { fontFamily: FONT, fontSize: 11, color: THEME.muted, marginTop: 3, marginBottom: 9, textAlign: align },
    listCardBottom: { flexDirection: row, justifyContent: 'space-between', marginTop: 9, alignItems: 'center' },
    listPercent: { fontFamily: FONT, fontSize: 12, fontWeight: '700', color: THEME.primary },
    memberCountRow: { flexDirection: row, alignItems: 'center', gap: 4 },
    memberCount: { fontFamily: FONT, color: THEME.muted, fontSize: 11 },
    newListCard: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: THEME.line, borderStyle: 'dashed', backgroundColor: 'transparent' },
    newListCircle: { width: 47, height: 47, borderRadius: 18, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    newListText: { fontFamily: FONT, fontSize: 14, fontWeight: '800', color: THEME.primary },

    historyCallout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.surface, borderRadius: 20, borderWidth: 1, borderColor: THEME.line, padding: 16, marginTop: 22 },
    historyCalloutLeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyCalloutIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    historyCalloutTitle: { fontFamily: FONT, fontSize: 14, fontWeight: '800', color: THEME.ink, textAlign: align },
    historyCalloutText: { fontFamily: FONT, fontSize: 12, color: THEME.muted, marginTop: 2, textAlign: align },
    linkText: { fontFamily: FONT, color: THEME.primary, fontSize: 13, fontWeight: '700' },

    // Lists screen
    searchBox: { minHeight: 48, backgroundColor: THEME.surface, borderRadius: 15, borderWidth: 1, borderColor: THEME.line, flexDirection: row, alignItems: 'center', paddingHorizontal: 13, marginBottom: 13, gap: 8 },
    searchInput: { flex: 1, fontFamily: FONT, color: THEME.ink, fontSize: 13, paddingVertical: 9, textAlign: align },

    fullListCard: { flexDirection: row, alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 20, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: THEME.line, gap: 13 },
    fullListEmoji: {},
    fullListMain: { flex: 1 },
    fullListTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fullListName: { fontFamily: FONT, color: THEME.ink, fontSize: 15, fontWeight: '800', textAlign: align },
    fullListNameRow: { flexDirection: row, alignItems: 'center', gap: 6 },
    sharedBadge: { width: 18, height: 18, borderRadius: 6, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    listCardIconRow: { flexDirection: row, alignItems: 'center', gap: 6 },
    fullListMeta: { fontFamily: FONT, color: THEME.muted, fontSize: 11, textAlign: align, marginTop: 4, marginBottom: 6 },

    // List detail
    detailWrap: { flex: 1 },
    detailActionRow: { flexDirection: row, gap: 10, marginBottom: 13 },
    detailHeaderActions: { flexDirection: row, alignItems: 'center', gap: 6 },
    sharedNotice: { flexDirection: row, alignItems: 'center', gap: 8, backgroundColor: THEME.primarySoft, borderRadius: 13, padding: 12, marginBottom: 13 },
    sharedNoticeText: { flex: 1, fontFamily: FONT, fontSize: 12, color: THEME.primaryDark, textAlign: align },
    sharedNoticeCode: { fontFamily: FONT, fontSize: 13, fontWeight: '800', color: THEME.primary, letterSpacing: 2 },
    addInput: { flex: 1, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surface, flexDirection: row, alignItems: 'center', paddingHorizontal: 13, gap: 8 },
    addInputText: { fontFamily: FONT, color: THEME.faint, fontSize: 13 },
    categoryScroll: { flexDirection: 'row', gap: 7, paddingBottom: 13 },

    itemGroup: { marginBottom: 14 },
    groupHeader: { flexDirection: row, alignItems: 'center', gap: 8, marginBottom: 8 },
    groupTitle: { fontFamily: FONT, fontSize: 14, fontWeight: '800', color: THEME.ink },
    groupCount: { fontFamily: FONT, fontSize: 12, color: THEME.faint, marginHorizontal: 4 },
    itemRow: { flexDirection: row, alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 16, borderWidth: 1, borderColor: THEME.line, padding: 12, marginBottom: 8, gap: 11 },
    itemRowDone: { opacity: 0.55 },
    checkCircle: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#C6C9D7', alignItems: 'center', justifyContent: 'center' },
    checkCircleDone: { backgroundColor: THEME.success, borderColor: THEME.success },
    itemMain: { flex: 1 },
    itemName: { fontFamily: FONT, fontSize: 14, fontWeight: '700', color: THEME.ink, textAlign: align },
    itemNameDone: { textDecorationLine: 'line-through', color: THEME.faint },
    itemMeta: { fontFamily: FONT, fontSize: 11, color: THEME.muted, marginTop: 2, textAlign: align },
    detailSpacer: { height: 12 },
    finishBar: { flexDirection: row, alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.dark, borderRadius: 20, padding: 16, marginTop: 6 },

    // Add-item modal
    entryTabs: { flexDirection: row, gap: 8, marginBottom: 16 },
    entryTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 13, borderWidth: 1, borderColor: THEME.line, gap: 5 },
    entryTabActive: { borderColor: THEME.primary, backgroundColor: THEME.primarySoft },
    entryTabText: { fontFamily: FONT, fontSize: 12, fontWeight: '700', color: THEME.muted },
    entryTabTextActive: { color: THEME.primary },
    formRow: { flexDirection: row, gap: 10, marginTop: 10 },
    smallInput: { flex: 1 },
    recentLabel: { fontFamily: FONT, fontSize: 12, fontWeight: '700', color: THEME.muted, marginTop: 16, marginBottom: 8, textAlign: align },
    horizontalChoices: { flexDirection: 'row', gap: 7, paddingBottom: 5 },

    voicePanel: { alignItems: 'center', paddingVertical: 26 },
    voiceCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    voiceCircleActive: { backgroundColor: THEME.primary },
    voiceText: { fontFamily: FONT, fontSize: 13, color: THEME.muted, textAlign: 'center', marginBottom: 16, paddingHorizontal: 10, lineHeight: 20 },

    infoBanner: { flexDirection: row, alignItems: 'center', gap: 8, backgroundColor: THEME.primarySoft, borderRadius: 13, padding: 12, marginTop: 6, marginBottom: 4 },
    infoBannerText: { flex: 1, fontFamily: FONT, fontSize: 12, color: THEME.primaryDark, textAlign: align },
    errorBanner: { flexDirection: row, alignItems: 'center', gap: 8, backgroundColor: THEME.dangerSoft, borderRadius: 13, padding: 12, marginTop: 6, marginBottom: 4 },
    errorBannerText: { flex: 1, fontFamily: FONT, fontSize: 12, color: THEME.danger, textAlign: align },

    emojiGrid: { flexDirection: row, flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    emojiChoice: { width: 46, height: 46, borderRadius: 14, backgroundColor: THEME.surfaceAlt || '#F3F3F8', borderWidth: 1, borderColor: THEME.line, alignItems: 'center', justifyContent: 'center' },
    emojiChoiceActive: { borderColor: THEME.primary, backgroundColor: THEME.primarySoft },

    managerList: { maxHeight: 320 },
    managerRow: { flexDirection: row, alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: THEME.line },
    managerName: { flex: 1, fontFamily: FONT, fontSize: 14, fontWeight: '700', color: THEME.ink, textAlign: align },
    addInlineButton: { marginBottom: 14 },

    // History (previous lists)
    historyRow: { flexDirection: row, alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 18, borderWidth: 1, borderColor: THEME.line, padding: 14, marginBottom: 10, gap: 12 },
    historyIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    historyMain: { flex: 1 },
    historyName: { fontFamily: FONT, fontSize: 14, fontWeight: '800', color: THEME.ink, textAlign: align },
    historyMeta: { fontFamily: FONT, fontSize: 11, color: THEME.muted, marginTop: 3, textAlign: align },
    historyActions: { flexDirection: row, gap: 6 },
    historyActionButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.surfaceAlt || '#F3F3F8' },

    // Profile
    profileCard: { flexDirection: row, alignItems: 'center', gap: 13, backgroundColor: THEME.surface, borderRadius: 20, borderWidth: 1, borderColor: THEME.line, padding: 16, marginBottom: 22 },
    profileAvatar: { width: 53, height: 53, borderRadius: 18, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    profileMain: { flex: 1 },
    profileName: { fontFamily: FONT, fontSize: 16, fontWeight: '800', color: THEME.ink, textAlign: align },
    profileMeta: { fontFamily: FONT, fontSize: 12, color: THEME.muted, marginTop: 2, textAlign: align },

    settingsCard: { backgroundColor: THEME.surface, borderRadius: 20, borderWidth: 1, borderColor: THEME.line, marginBottom: 22 },
    settingRow: { flexDirection: row, alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: THEME.line },
    settingIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    settingMain: { flex: 1 },
    settingTitle: { fontFamily: FONT, fontSize: 14, fontWeight: '700', color: THEME.ink, textAlign: align },
    settingSub: { fontFamily: FONT, fontSize: 11, color: THEME.muted, marginTop: 2, textAlign: align },
    switch: { width: 43, height: 25, borderRadius: 13, backgroundColor: '#D9DCE6', padding: 3, justifyContent: 'center' },
    switchOn: { backgroundColor: THEME.primary },
    switchKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#fff', alignSelf: isRTL ? 'flex-end' : 'flex-start' },
    switchKnobOn: { alignSelf: isRTL ? 'flex-start' : 'flex-end' },

    resetRow: { flexDirection: row, alignItems: 'center', gap: 10, paddingVertical: 14, justifyContent: 'center' },
    resetText: { fontFamily: FONT, color: THEME.danger, fontSize: 14, fontWeight: '700' },
    versionText: { fontFamily: FONT, color: THEME.faint, fontSize: 11, textAlign: 'center', marginTop: 8 },

    choiceList: {},
    choiceListRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.surfaceAlt || '#F3F3F8', borderRadius: 14, paddingHorizontal: 13, marginBottom: 7 },
    choiceListText: { fontFamily: FONT, fontSize: 14, color: THEME.ink },
    radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: '#C8CBD8', alignItems: 'center', justifyContent: 'center' },
    radioActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },

    brandMini: { width: 42, height: 42, borderRadius: 14, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
    contactBrand: { flexDirection: row, alignItems: 'center', gap: 12, marginBottom: 16 },
    contactName: { fontFamily: FONT, fontSize: 15, fontWeight: '800', color: THEME.ink, textAlign: align },
    contactSub: { fontFamily: FONT, fontSize: 12, color: THEME.muted, textAlign: align },
    contactRow: { flexDirection: row, alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: THEME.line },
    contactMain: { flex: 1 },
    contactLabel: { fontFamily: FONT, fontSize: 13, fontWeight: '700', color: THEME.ink, textAlign: align },
    contactValue: { fontFamily: FONT, fontSize: 12, color: THEME.muted, marginTop: 2, textAlign: align },

    bottomNav: { position: 'absolute', left: 14, right: 14, bottom: 12, minHeight: 70, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: THEME.line, flexDirection: row, alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 5, shadowColor: '#14151F', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
    navItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4 },
    navLabel: { fontFamily: FONT, fontSize: 10, color: THEME.muted, fontWeight: '600' },
    navLabelActive: { color: THEME.primary, fontWeight: '800' },
  });
};

// ---------------------------------------------------------------------------
// Shared small components. Each takes `styles`/`isRTL` so they stay in sync
// with the current language direction.
// ---------------------------------------------------------------------------
const Button = ({ children, onPress, variant = 'primary', icon, style, disabled = false, styles, isRTL }) => (
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
    {icon ? <Icon name={icon} size={19} isRTL={isRTL} color={variant === 'primary' ? '#fff' : variant === 'danger' ? THEME.danger : THEME.primary} /> : null}
    <Text style={[styles.buttonText, variant !== 'primary' && styles.buttonTextDark]}>{children}</Text>
  </Pressable>
);

const Pill = ({ children, active = false, onPress, icon, style, styles }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed, style]}
  >
    {icon ? <Glyph value={icon} size={14} color={active ? '#fff' : THEME.primary} /> : null}
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text>
  </Pressable>
);

const SectionTitle = ({ title, action, onAction, styles, isRTL }) => (
  <View style={styles.sectionTitleRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action ? <Pressable onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text><Icon name="forward" size={15} isRTL={isRTL} color={THEME.primary} /></Pressable> : null}
  </View>
);

const ProgressBar = ({ value, color = THEME.primary, styles }) => (
  <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} /></View>
);

const ScreenHeader = ({ title, subtitle, onBack, right, styles, isRTL }) => (
  <View style={styles.screenHeader}>
    <View style={styles.headerLeading}>
      {onBack ? <Pressable onPress={onBack} style={styles.iconButton}><Icon name="back" size={26} isRTL={isRTL} color={THEME.ink} /></Pressable> : null}
      <View>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    {right || null}
  </View>
);

const ModalShell = ({ visible, onClose, title, children, styles }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalTitleRow}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}><Icon name="close" size={20} color={THEME.muted} /></Pressable>
        </View>
        {children}
      </View>
    </View>
  </Modal>
);

const EmptyState = ({ icon = 'cart-shopping', title, text, action, onAction, styles }) => (
  <View style={styles.emptyState}>
    <Glyph value={icon} size={34} color={THEME.faint} style={styles.emptyIcon} />
    <Text style={styles.emptyTitle}>{title}</Text>
    {text ? <Text style={styles.emptyText}>{text}</Text> : null}
    {action ? <Button onPress={onAction} icon="plus" styles={styles}>{action}</Button> : null}
  </View>
);

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
const App = () => {
  const [hydrated, setHydrated] = useState(false);
  const [setup, setSetup] = useState({ onboardingDone: false, userName: '', language: 'fa', currency: 'toman', notifications: false });
  const [lists, setLists] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('home');
  const [activeListId, setActiveListId] = useState('home');
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [itemDraft, setItemDraft] = useState({ name: '', quantity: '1', category: 'dairy' });
  const [entryTab, setEntryTab] = useState('manual');
  const [entryMessage, setEntryMessage] = useState('');
  const [entryError, setEntryError] = useState('');
  const [newListDraft, setNewListDraft] = useState({ name: '', icon: 'cart-shopping' });
  const [newCategoryDraft, setNewCategoryDraft] = useState({ label: '', icon: 'box' });
  const [onboardingDraft, setOnboardingDraft] = useState({ name: '', language: 'fa', currency: 'toman' });
  const [notifMessage, setNotifMessage] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Before onboarding completes, the language pill the user just tapped
  // (onboardingDraft.language) should drive layout immediately — not the
  // not-yet-saved setup.language — so direction flips live as they choose.
  const activeLanguage = setup.onboardingDone ? setup.language : onboardingDraft.language;
  const t = STRINGS[activeLanguage] || STRINGS.fa;
  const isRTL = t.dir === 'rtl';
  const styles = useMemo(() => createStyles(isRTL), [isRTL]);

  // The static HTML shell always ships with dir="rtl" (Persian is the
  // default language). When the user picks English, flip the document's
  // actual direction at runtime so native browser/WebView text shaping,
  // scrollbars, and any un-styled elements follow along too.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = setup.language;
    if (document.body) document.body.style.direction = isRTL ? 'rtl' : 'ltr';
    const root = document.getElementById('root');
    if (root) root.style.direction = isRTL ? 'rtl' : 'ltr';
  }, [isRTL, setup.language]);
  const voice = useVoiceRecognition();

  useEffect(() => {
    const saved = loadInitialState();
    setSetup({
      onboardingDone: saved.onboardingDone,
      userName: saved.userName,
      language: saved.language,
      currency: saved.currency,
      notifications: saved.notifications,
    });
    setLists(saved.lists);
    setCategories(saved.categories);
    setHistory(saved.history);
    setOnboardingDraft({ name: saved.userName || '', language: saved.language || 'fa', currency: saved.currency || 'toman' });
    if (saved.lists[0]) setActiveListId(saved.lists[0].id);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(STORAGE_KEY, { version: 5, ...setup, lists, categories, history });
  }, [hydrated, setup, lists, categories, history]);

  const activeList = useMemo(() => lists.find((list) => list.id === activeListId) || lists[0], [lists, activeListId]);
  const activeItems = activeList?.items || [];
  const openItems = activeItems.filter((item) => !item.done);
  const completedItems = activeItems.filter((item) => item.done);
  const completion = activeItems.length ? Math.round((completedItems.length / activeItems.length) * 100) : 0;
  const totalOpenItems = lists.reduce((sum, list) => sum + list.items.filter((item) => !item.done).length, 0);

  // Realtime: while a shared list is open, mirror every insert/update/delete
  // from other members into local state immediately. Only the list actually
  // on screen subscribes — personal lists never touch the network.
  useEffect(() => {
    if (!activeList?.shared || view !== 'detail') return undefined;
    const code = activeList.id;
    const channel = supabase.channel(`list-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_items', filter: `list_id=eq.${code}` }, (payload) => {
        setLists((current) => current.map((list) => {
          if (list.id !== code) return list;
          if (payload.eventType === 'DELETE') {
            return { ...list, items: list.items.filter((item) => item.id !== payload.old.id) };
          }
          const incoming = normalizeItem({
            id: payload.new.id, name: payload.new.name, category: payload.new.category,
            quantity: payload.new.quantity, done: payload.new.done, createdAt: new Date(payload.new.created_at).getTime(),
          });
          const exists = list.items.some((item) => item.id === incoming.id);
          return { ...list, items: exists ? list.items.map((item) => (item.id === incoming.id ? incoming : item)) : [...list.items, incoming] };
        }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shared_lists', filter: `id=eq.${code}` }, (payload) => {
        setLists((current) => current.map((list) => (list.id === code ? { ...list, name: payload.new.name, icon: payload.new.icon } : list)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeList?.shared, activeList?.id, view]);

  const navigate = (nextView) => {
    setModal(null);
    setView(nextView);
    if (nextView !== 'detail') setFilter('all');
  };

  const saveOnboarding = () => {
    const name = onboardingDraft.name.trim();
    if (!name) return;
    setSetup((current) => ({ ...current, userName: name, language: onboardingDraft.language, currency: onboardingDraft.currency, onboardingDone: true }));
    navigate('home');
  };

  const updateActiveList = (updater) => {
    setLists((current) => current.map((list) => (list.id === activeListId ? updater(list) : list)));
  };

  const addItem = (name) => {
    const finalName = String(name ?? itemDraft.name).trim();
    if (!finalName) {
      setEntryMessage('');
      setEntryError(t.nameRequired);
      return;
    }
    const item = normalizeItem({
      id: makeId('item'),
      name: finalName,
      category: itemDraft.category || 'other',
      quantity: itemDraft.quantity || '1',
      done: false,
    });
    updateActiveList((list) => ({ ...list, updatedAt: Date.now(), items: [...list.items, item] }));
    if (activeList?.shared) {
      supabase.from('shared_items').insert({ id: item.id, list_id: activeList.id, name: item.name, category: item.category, quantity: item.quantity, done: false }).then(() => {});
    }
    setItemDraft((current) => ({ ...current, name: '' }));
    setEntryError('');
    setEntryMessage('');
    setModal(null);
  };

  const toggleItem = (itemId) => {
    let nextDone = null;
    updateActiveList((list) => {
      const target = list.items.find((item) => item.id === itemId);
      if (!target) return list;
      nextDone = !target.done;
      const rest = list.items.filter((item) => item.id !== itemId);
      return { ...list, updatedAt: Date.now(), items: [...rest, { ...target, done: nextDone }] };
    });
    if (activeList?.shared && nextDone !== null) {
      supabase.from('shared_items').update({ done: nextDone }).eq('id', itemId).then(() => {});
    }
  };

  const removeItem = (itemId) => {
    const wasShared = activeList?.shared;
    updateActiveList((list) => ({ ...list, items: list.items.filter((item) => item.id !== itemId) }));
    if (wasShared) {
      supabase.from('shared_items').delete().eq('id', itemId).then(() => {});
    }
  };

  const createList = () => {

    const name = newListDraft.name.trim();
    if (!name) return;
    const list = { id: makeId('list'), name, icon: newListDraft.icon || 'cart-shopping', updatedAt: Date.now(), items: [] };
    setLists((current) => [list, ...current]);
    setActiveListId(list.id);
    setNewListDraft({ name: '', icon: 'cart-shopping' });
    setModal(null);
    setView('detail');
  };

  const deleteList = (listId) => {
    setLists((current) => current.filter((list) => list.id !== listId));
    if (activeListId === listId) setActiveListId(lists[0]?.id);
  };

  const archiveActiveList = () => {
    if (!activeList || !activeItems.length) {
      setModal(null);
      return;
    }
    setHistory((current) => [{
      id: makeId('history'),
      listName: activeList.name || t.newList,
      date: new Date().toISOString(),
      count: activeItems.length,
      items: activeItems.map((item) => ({ name: item.name, category: item.category, quantity: item.quantity })),
    }, ...current]);
    if (activeList.shared) {
      supabase.from('shared_items').delete().eq('list_id', activeList.id).then(() => {});
    }
    updateActiveList((list) => ({ ...list, items: [] }));
    setModal(null);
    setView('home');
  };

  const restoreFromHistory = (record) => {
    const list = {
      id: makeId('list'),
      name: record.listName,
      icon: 'cart-shopping',
      updatedAt: Date.now(),
      items: (record.items || []).map((item) => normalizeItem({ ...item, id: makeId('item') })),
    };
    setLists((current) => [list, ...current]);
    setActiveListId(list.id);
    setView('detail');
  };

  const deleteHistoryEntry = (id) => setHistory((current) => current.filter((record) => record.id !== id));

  const shareActiveList = async () => {
    const lines = activeItems.map((item) => `• ${item.name} (${item.quantity})`).join('\n');
    const text = t.listShareText(activeList?.name || t.appName, lines);
    try {
      if (Platform.OS !== 'web' && Share?.share) {
        await Share.share({ message: text });
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: activeList?.name || t.appName, text });
      } else {
        Alert.alert(t.share, text);
      }
    } catch {
      // Cancelled by user.
    }
  };

  // Turns the active (personal) list into a realtime shared list: pushes it
  // to Supabase under a fresh 6-character code, then opens the share sheet
  // with a ready-to-send invite message containing that code.
  const startSharingActiveList = async () => {
    if (!activeList || activeList.shared) return;
    setSyncBusy(true);
    setSyncMessage('');
    try {
      const code = generateShareCode();
      await pushListToSupabase(activeList, code);
      setLists((current) => current.map((list) => (list.id === activeList.id ? { ...list, id: code, shared: true } : list)));
      setActiveListId(code);
      const message = t.shareMessage(activeList.name || t.newList, code);
      if (Platform.OS !== 'web' && Share?.share) {
        await Share.share({ message });
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: t.appName, text: message });
      } else {
        Alert.alert(t.shareCreated(code), message);
      }
    } catch {
      setSyncMessage(t.shareError);
    } finally {
      setSyncBusy(false);
    }
  };

  const joinSharedList = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) {
      setSyncMessage(t.codeRequired);
      return;
    }
    if (lists.some((list) => list.id === code)) {
      setSyncMessage(t.alreadyShared);
      return;
    }
    setSyncBusy(true);
    setSyncMessage('');
    try {
      const remote = await fetchSharedList(code);
      if (!remote) {
        setSyncMessage(t.codeInvalid);
        return;
      }
      setLists((current) => [remote, ...current]);
      setActiveListId(remote.id);
      setJoinCode('');
      setModal(null);
      setView('detail');
    } catch {
      setSyncMessage(t.shareError);
    } finally {
      setSyncBusy(false);
    }
  };

  const addCategory = () => {
    if (!newCategoryDraft.label.trim()) return;
    setCategories((current) => [...current, { id: makeId('cat'), label: newCategoryDraft.label.trim(), icon: newCategoryDraft.icon || 'box' }]);
    setNewCategoryDraft({ label: '', icon: 'box' });
    setModal(null);
  };

  const removeCategory = (categoryId) => {
    if (categories.length <= 1) return;
    setCategories((current) => current.filter((category) => category.id !== categoryId));
    setLists((current) => current.map((list) => ({
      ...list,
      items: list.items.map((item) => (item.category === categoryId ? { ...item, category: 'other' } : item)),
    })));
  };

  const resetData = () => {
    const perform = () => {
      const fresh = createEmptyState();
      setSetup({ onboardingDone: false, userName: '', language: 'fa', currency: 'toman', notifications: false });
      setLists(fresh.lists);
      setCategories(fresh.categories);
      setHistory([]);
      setOnboardingDraft({ name: '', language: 'fa', currency: 'toman' });
      setModal(null);
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(t.resetConfirmText)) perform();
    } else {
      Alert.alert(t.resetConfirmTitle, t.resetConfirmText, [{ text: t.cancel, style: 'cancel' }, { text: t.resetConfirmButton, style: 'destructive', onPress: perform }]);
    }
  };

  const openContact = (kind) => {
    const links = {
      whatsapp: 'https://wa.me/989198433408',
      telegram: 'https://t.me/NziCode',
      email: 'mailto:nazari.moradkhani@gmail.com',
    };
    const url = links[kind];
    if (url) Linking.openURL(url).catch(() => Alert.alert(t.contact, url));
  };

  const exportBackup = async () => {
    const backup = JSON.stringify({ exportedAt: new Date().toISOString(), app: t.appName, setup, lists, categories, history }, null, 2);
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([backup], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'KharidYar-backup.json';
        anchor.click();
        URL.revokeObjectURL(url);
        Alert.alert(t.backup, t.backupDone);
      } else if (Share?.share) {
        await Share.share({ title: t.backup, message: backup });
      }
    } catch {
      Alert.alert(t.backup, t.backupFailed);
    }
  };

  const toggleNotifications = async () => {
    if (setup.notifications) {
      await cancelNotifications();
      setSetup((current) => ({ ...current, notifications: false }));
      setNotifMessage('');
      return;
    }
    const result = await requestNotifications(t.appName, t.notificationsSubOn);
    if (result.ok) {
      setSetup((current) => ({ ...current, notifications: true }));
      setNotifMessage('');
    } else {
      setNotifMessage(result.reason === 'denied' ? t.notificationsDenied : t.notificationsUnsupported);
    }
  };

  const startVoiceEntry = () => {
    setEntryError('');
    setEntryMessage('');
    voice.start(
      setup.language,
      (text) => {
        if (text) {
          setItemDraft((current) => ({ ...current, name: text }));
          setEntryMessage(t.voiceHeard(text));
        } else {
          setEntryError(t.voiceError);
        }
      },
      (errorCode) => {
        setEntryError(errorCode === 'not-allowed' ? t.voiceDenied : errorCode === 'unsupported' ? t.voiceUnsupported : t.voiceError);
      }
    );
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
    if (uncategorized.length) groups.push({ id: 'other', label: t.categories.other, icon: 'box', items: uncategorized });
    return groups;
  }, [categories, filteredItems, t]);

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.loading}>
        <StatusBar barStyle="dark-content" />
        <Icon name="cart" size={44} color={THEME.primary} />
        <Text style={styles.loadingText}>{t.appName}</Text>
      </SafeAreaView>
    );
  }

  if (!setup.onboardingDone) {
    return (
      <SafeAreaView style={styles.appShell}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.onboarding}>
          <View style={styles.brandMark}><Icon name="cart" size={34} color="#fff" /></View>
          <Text style={styles.brandName}>{STRINGS[onboardingDraft.language].appName}</Text>
          <Text style={styles.brandTagline}>{STRINGS[onboardingDraft.language].tagline}</Text>
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>{STRINGS[onboardingDraft.language].welcomeTitle}</Text>
            <Text style={styles.onboardingText}>{STRINGS[onboardingDraft.language].welcomeSubtitle}</Text>
            <Text style={styles.fieldLabel}>{STRINGS[onboardingDraft.language].nameLabel}</Text>
            <TextInput
              value={onboardingDraft.name}
              onChangeText={(name) => setOnboardingDraft((current) => ({ ...current, name }))}
              placeholder={STRINGS[onboardingDraft.language].namePlaceholder}
              placeholderTextColor={THEME.faint}
              style={styles.input}
              textAlign={onboardingDraft.language === 'en' ? 'left' : 'right'}
            />
            <Text style={styles.fieldLabel}>{STRINGS[onboardingDraft.language].languageLabel}</Text>
            <View style={styles.choiceRow}>
              {['fa', 'en'].map((lang) => (
                <Pill key={lang} styles={styles} active={onboardingDraft.language === lang} onPress={() => setOnboardingDraft((current) => ({ ...current, language: lang }))}>
                  {lang === 'fa' ? STRINGS.fa.farsi : STRINGS.en.english}
                </Pill>
              ))}
            </View>
            <Text style={styles.fieldLabel}>{STRINGS[onboardingDraft.language].currencyLabel}</Text>
            <View style={styles.choiceRow}>
              {['toman', 'rial'].map((cur) => (
                <Pill key={cur} styles={styles} active={onboardingDraft.currency === cur} onPress={() => setOnboardingDraft((current) => ({ ...current, currency: cur }))}>
                  {cur === 'toman' ? STRINGS[onboardingDraft.language].toman : STRINGS[onboardingDraft.language].rial}
                </Pill>
              ))}
            </View>
            <Button onPress={saveOnboarding} icon="forward" styles={styles} isRTL={STRINGS[onboardingDraft.language].dir === 'rtl'} style={styles.continueButton} disabled={!onboardingDraft.name.trim()}>
              {STRINGS[onboardingDraft.language].continueButton}
            </Button>
          </View>
          <Text style={styles.onboardingFoot}>{STRINGS[onboardingDraft.language].onboardingFoot}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderHome = () => (
    <>
      <View style={styles.homeTop}>
        <View style={styles.homeTopLeading}>
          <Pressable onPress={() => navigate('profile')} style={styles.avatar}><Icon name="profile" size={18} color={THEME.primary} /></Pressable>
          <View style={styles.greeting}><Text style={styles.greetingText}>{t.greeting(setup.userName)}</Text><Text style={styles.greetingSub}>{t.homeSubtitle}</Text></View>
        </View>
        <Pressable onPress={() => setModal('newList')} style={styles.roundPrimary}><Icon name="plus" size={20} color="#fff" /></Pressable>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statNumber}>{lists.length}</Text><Text style={styles.statLabel}>{t.statLists}</Text></View>
        <View style={styles.statCard}><Text style={styles.statNumber}>{totalOpenItems}</Text><Text style={styles.statLabel}>{t.statOpenItems}</Text></View>
      </View>
      <SectionTitle styles={styles} isRTL={isRTL} title={t.activeLists} action={t.seeAll} onAction={() => navigate('lists')} />
      {lists.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ direction: 'rtl' === t.dir ? 'rtl' : 'ltr' }} contentContainerStyle={styles.horizontalCards}>
          {lists.slice(0, 6).map((list) => {
            const done = list.items.filter((item) => item.done).length;
            const percent = list.items.length ? Math.round((done / list.items.length) * 100) : 0;
            return (
              <Pressable key={list.id} onPress={() => { setActiveListId(list.id); setView('detail'); }} style={styles.listCard}>
                <View style={styles.listCardTop}>
                  <View style={styles.listCardIconRow}>
                    <Glyph value={list.icon} size={24} color={THEME.primary} />
                    {list.shared ? <View style={styles.sharedBadge}><Icon name="users" size={10} color={THEME.primary} /></View> : null}
                  </View>
                  <Icon name="forward" size={17} color={THEME.faint} isRTL={isRTL} />
                </View>
                <Text style={styles.listName} numberOfLines={1}>{list.name || t.newList}</Text>
                <Text style={styles.listMeta}>{list.items.length ? t.doneOf(done, list.items.length) : t.emptyAndReady}</Text>
                <ProgressBar styles={styles} value={percent} />
              </Pressable>
            );
          })}
          <Pressable onPress={() => setModal('newList')} style={[styles.listCard, styles.newListCard]}>
            <View style={styles.newListCircle}><Icon name="plus" size={22} color={THEME.primary} /></View>
            <Text style={styles.newListText}>{t.newList}</Text>
            <Text style={styles.listMeta}>{t.newListSub}</Text>
          </Pressable>
        </ScrollView>
      ) : <EmptyState styles={styles} icon="clipboard-list" title={t.emptyListsTitle} action={t.createList} onAction={() => setModal('newList')} />}
      <Pressable onPress={() => navigate('history')} style={styles.historyCallout}>
        <View style={styles.historyCalloutLeading}>
          <View style={styles.historyCalloutIcon}><Icon name="history" size={19} color={THEME.primary} /></View>
          <View><Text style={styles.historyCalloutTitle}>{t.previousLists}</Text><Text style={styles.historyCalloutText}>{t.previousListsSub(history.length)}</Text></View>
        </View>
        <Icon name="forward" size={16} color={THEME.faint} isRTL={isRTL} />
      </Pressable>
    </>
  );

  const renderLists = () => (
    <>
      <ScreenHeader styles={styles} isRTL={isRTL} title={t.myLists} subtitle={t.activeCount(lists.length)} right={<Pressable onPress={() => setModal('newList')} style={styles.roundPrimary}><Icon name="plus" size={20} color="#fff" /></Pressable>} />
      <View style={styles.searchBox}><Icon name="search" size={18} color={THEME.primary} /><TextInput value={search} onChangeText={setSearch} placeholder={t.searchLists} placeholderTextColor={THEME.faint} style={styles.searchInput} textAlign={isRTL ? 'right' : 'left'} /></View>
      {lists.length ? lists.filter((list) => !search.trim() || list.name.includes(search.trim())).map((list) => {
        const done = list.items.filter((item) => item.done).length;
        const percent = list.items.length ? Math.round((done / list.items.length) * 100) : 0;
        return (
          <Pressable key={list.id} onPress={() => { setActiveListId(list.id); setView('detail'); }} onLongPress={() => deleteList(list.id)} style={styles.fullListCard}>
            <Glyph value={list.icon} size={26} color={THEME.primary} />
            <View style={styles.fullListMain}>
              <View style={styles.fullListTitleRow}>
                <View style={styles.fullListNameRow}>
                  <Text style={styles.fullListName}>{list.name || t.newList}</Text>
                  {list.shared ? <View style={styles.sharedBadge}><Icon name="users" size={10} color={THEME.primary} /></View> : null}
                </View>
                <Icon name="forward" size={16} color={THEME.faint} isRTL={isRTL} />
              </View>
              <Text style={styles.fullListMeta}>{list.items.length ? t.itemsCount(list.items.length) : t.emptyAndReady}</Text>
              <ProgressBar styles={styles} value={percent} />
            </View>
          </Pressable>
        );
      }) : <EmptyState styles={styles} icon="clipboard-list" title={t.noListsTitle} text={t.noListsText} action={t.createList} onAction={() => setModal('newList')} />}
      <Pressable onPress={() => navigate('history')} style={styles.historyCallout}>
        <View style={styles.historyCalloutLeading}>
          <View style={styles.historyCalloutIcon}><Icon name="history" size={19} color={THEME.primary} /></View>
          <View><Text style={styles.historyCalloutTitle}>{t.previousLists}</Text><Text style={styles.historyCalloutText}>{t.previousListsSub(history.length)}</Text></View>
        </View>
        <Text style={styles.linkText}>{t.view}</Text>
      </Pressable>
      <Pressable onPress={() => { setSyncMessage(''); setJoinCode(''); setModal('joinList'); }} style={styles.historyCallout}>
        <View style={styles.historyCalloutLeading}>
          <View style={styles.historyCalloutIcon}><Icon name="users" size={19} color={THEME.primary} /></View>
          <View><Text style={styles.historyCalloutTitle}>{t.joinList}</Text><Text style={styles.historyCalloutText}>{t.joinListSub}</Text></View>
        </View>
        <Icon name="forward" size={16} color={THEME.faint} isRTL={isRTL} />
      </Pressable>
    </>
  );

  const renderDetail = () => (
    <View style={styles.detailWrap}>
      <ScreenHeader
        styles={styles} isRTL={isRTL}
        title={activeList?.name || t.newList}
        subtitle={t.itemsCount(activeItems.length)}
        onBack={() => setView('home')}
        right={
          <View style={styles.detailHeaderActions}>
            {!activeList?.shared ? (
              <Pressable onPress={startSharingActiveList} style={styles.iconButton} disabled={syncBusy}><Icon name="users" size={19} color={THEME.primary} /></Pressable>
            ) : null}
            <Pressable onPress={shareActiveList} style={styles.iconButton}><Icon name="share" size={19} color={THEME.primary} /></Pressable>
          </View>
        }
      />
      {activeList?.shared ? (
        <View style={styles.sharedNotice}>
          <Icon name="users" size={15} color={THEME.primary} />
          <Text style={styles.sharedNoticeText}>{t.sharedMembers}</Text>
          <Text style={styles.sharedNoticeCode}>{activeList.id}</Text>
        </View>
      ) : null}
      {syncMessage ? <View style={styles.errorBanner}><Icon name="close" size={15} color={THEME.danger} /><Text style={styles.errorBannerText}>{syncMessage}</Text></View> : null}
      <View style={styles.detailActionRow}>
        <Pressable onPress={() => { setEntryTab('manual'); setEntryError(''); setEntryMessage(''); setModal('addItem'); }} style={styles.addInput}>
          <Icon name="plus" size={18} color={THEME.primary} /><Text style={styles.addInputText}>{t.addItemPlaceholder}</Text>
        </Pressable>
      </View>
      <View style={styles.searchBox}><Icon name="search" size={18} color={THEME.primary} /><TextInput value={search} onChangeText={setSearch} placeholder={t.searchItems} placeholderTextColor={THEME.faint} style={styles.searchInput} textAlign={isRTL ? 'right' : 'left'} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        <Pill styles={styles} active={filter === 'all'} onPress={() => setFilter('all')} icon="wand-magic-sparkles">{t.allCategories}</Pill>
        {categories.map((category) => <Pill key={category.id} styles={styles} active={filter === category.id} onPress={() => setFilter(category.id)} icon={category.icon}>{categoryLabel(t, category)}</Pill>)}
        <Pill styles={styles} onPress={() => setModal('categories')} icon="sliders">{t.manage}</Pill>
      </ScrollView>
      {!filteredItems.length ? (
        <EmptyState styles={styles} icon="cart-shopping" title={t.emptyDetailTitle} text={t.emptyDetailText} action={t.addItem} onAction={() => { setEntryTab('manual'); setModal('addItem'); }} />
      ) : groupedItems.map((group) => (
        <View key={group.id} style={styles.itemGroup}>
          <View style={styles.groupHeader}><Glyph value={group.icon} size={15} color={THEME.primary} /><Text style={styles.groupTitle}>{categoryLabel(t, group)}</Text><Text style={styles.groupCount}>{group.items.length}</Text></View>
          {group.items.map((item) => (
            <Pressable key={item.id} onPress={() => toggleItem(item.id)} onLongPress={() => removeItem(item.id)} style={[styles.itemRow, item.done && styles.itemRowDone]}>
              <View style={[styles.checkCircle, item.done && styles.checkCircleDone]}>{item.done ? <Icon name="check" size={14} color="#fff" /> : null}</View>
              <View style={styles.itemMain}>
                <Text style={[styles.itemName, item.done && styles.itemNameDone]}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.quantity}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={styles.detailSpacer} />
      {activeItems.length ? (
        <View style={styles.finishBar}>
          <Text style={[styles.buttonText, { color: '#fff' }]}>{completion}%</Text>
          <Button onPress={archiveActiveList} icon="check" styles={styles} isRTL={isRTL} style={{ backgroundColor: THEME.success, minHeight: 44, paddingHorizontal: 16 }}>{t.finishShopping}</Button>
        </View>
      ) : null}
    </View>
  );

  const renderAddItemModal = () => (
    <ModalShell styles={styles} visible={modal === 'addItem'} onClose={() => { voice.stop(); setModal(null); }} title={t.addItemTitle}>
      <View style={styles.entryTabs}>
        <Pressable onPress={() => { voice.stop(); setEntryTab('manual'); setEntryError(''); setEntryMessage(''); }} style={[styles.entryTab, entryTab === 'manual' && styles.entryTabActive]}>
          <Icon name="edit" size={17} color={entryTab === 'manual' ? THEME.primary : THEME.muted} />
          <Text style={[styles.entryTabText, entryTab === 'manual' && styles.entryTabTextActive]}>{t.tabManual}</Text>
        </Pressable>
        <Pressable onPress={() => { setEntryTab('voice'); setEntryError(''); setEntryMessage(''); }} style={[styles.entryTab, entryTab === 'voice' && styles.entryTabActive]}>
          <Icon name="mic" size={17} color={entryTab === 'voice' ? THEME.primary : THEME.muted} />
          <Text style={[styles.entryTabText, entryTab === 'voice' && styles.entryTabTextActive]}>{t.tabVoice}</Text>
        </Pressable>
      </View>
      {entryTab === 'manual' ? (
        <>
          <TextInput value={itemDraft.name} onChangeText={(name) => setItemDraft((current) => ({ ...current, name }))} placeholder={t.itemNamePlaceholder} placeholderTextColor={THEME.faint} style={styles.input} textAlign={isRTL ? 'right' : 'left'} autoFocus />
          <View style={styles.formRow}>
            <TextInput value={itemDraft.quantity} onChangeText={(quantity) => setItemDraft((current) => ({ ...current, quantity }))} placeholder={t.quantityPlaceholder} placeholderTextColor={THEME.faint} style={[styles.input, styles.smallInput]} textAlign={isRTL ? 'right' : 'left'} />
          </View>
        </>
      ) : (
        <View style={styles.voicePanel}>
          <Pressable onPress={voice.listening ? voice.stop : startVoiceEntry} style={[styles.voiceCircle, voice.listening && styles.voiceCircleActive]}>
            <Icon name={voice.listening ? 'micOff' : 'mic'} size={32} color={voice.listening ? '#fff' : THEME.primary} />
          </Pressable>
          <Text style={styles.voiceText}>{voice.listening ? t.voiceListening : (itemDraft.name ? itemDraft.name : t.voiceIdle)}</Text>
          <Button onPress={voice.listening ? voice.stop : startVoiceEntry} variant="secondary" icon={voice.listening ? 'micOff' : 'mic'} styles={styles} isRTL={isRTL}>
            {voice.listening ? t.voiceStop : t.voiceStart}
          </Button>
        </View>
      )}
      <Text style={styles.fieldLabel}>{t.categoryLabel}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChoices}>
        {categories.map((category) => <Pill key={category.id} styles={styles} active={itemDraft.category === category.id} onPress={() => setItemDraft((current) => ({ ...current, category: category.id }))} icon={category.icon}>{categoryLabel(t, category)}</Pill>)}
      </ScrollView>
      {entryMessage ? <View style={styles.infoBanner}><Icon name="check" size={15} color={THEME.primary} /><Text style={styles.infoBannerText}>{entryMessage}</Text></View> : null}
      {entryError ? <View style={styles.errorBanner}><Icon name="close" size={15} color={THEME.danger} /><Text style={styles.errorBannerText}>{entryError}</Text></View> : null}
      <Button onPress={() => addItem()} icon="plus" styles={styles} isRTL={isRTL} style={styles.modalPrimaryButton}>{t.addToList}</Button>
    </ModalShell>
  );

  const renderNewListModal = () => (
    <ModalShell styles={styles} visible={modal === 'newList'} onClose={() => setModal(null)} title={t.newList}>
      <Text style={styles.fieldLabel}>{t.listNameLabel}</Text>
      <TextInput value={newListDraft.name} onChangeText={(name) => setNewListDraft((current) => ({ ...current, name }))} placeholder={t.listNamePlaceholder} placeholderTextColor={THEME.faint} style={styles.input} textAlign={isRTL ? 'right' : 'left'} autoFocus />
      <Text style={styles.fieldLabel}>{t.listIconLabel}</Text>
      <View style={styles.emojiGrid}>{LIST_ICON_CHOICES.map((icon) => <Pressable key={icon} onPress={() => setNewListDraft((current) => ({ ...current, icon }))} style={[styles.emojiChoice, newListDraft.icon === icon && styles.emojiChoiceActive]}><Glyph value={icon} size={20} color={newListDraft.icon === icon ? THEME.primary : THEME.muted} /></Pressable>)}</View>
      <Button onPress={createList} icon="plus" styles={styles} isRTL={isRTL} style={styles.modalPrimaryButton} disabled={!newListDraft.name.trim()}>{t.createList}</Button>
    </ModalShell>
  );

  const renderJoinListModal = () => (
    <ModalShell styles={styles} visible={modal === 'joinList'} onClose={() => { setModal(null); setSyncMessage(''); setJoinCode(''); }} title={t.joinList}>
      <Text style={styles.onboardingText}>{t.joinListSub}</Text>
      <TextInput
        value={joinCode}
        onChangeText={(value) => setJoinCode(value.toUpperCase().slice(0, 6))}
        placeholder={t.enterCode}
        placeholderTextColor={THEME.faint}
        style={[styles.input, { textAlign: 'center', fontSize: 22, letterSpacing: 6, fontWeight: '800' }]}
        autoCapitalize="characters"
        maxLength={6}
        autoFocus
      />
      {syncMessage ? <View style={styles.errorBanner}><Icon name="close" size={15} color={THEME.danger} /><Text style={styles.errorBannerText}>{syncMessage}</Text></View> : null}
      <Button onPress={joinSharedList} icon="forward" isRTL={isRTL} styles={styles} style={styles.modalPrimaryButton} disabled={syncBusy || joinCode.length < 6}>{syncBusy ? t.joining : t.joinButton}</Button>
    </ModalShell>
  );

  const renderNewCategoryModal = () => (

    <ModalShell styles={styles} visible={modal === 'newCategory'} onClose={() => setModal(null)} title={t.newCategoryTitle}>
      <TextInput value={newCategoryDraft.label} onChangeText={(label) => setNewCategoryDraft((current) => ({ ...current, label }))} placeholder={t.categoryNamePlaceholder} placeholderTextColor={THEME.faint} style={styles.input} textAlign={isRTL ? 'right' : 'left'} autoFocus />
      <Text style={styles.fieldLabel}>{t.chooseIcon}</Text>
      <View style={styles.emojiGrid}>{CATEGORY_ICON_CHOICES.map((icon) => <Pressable key={icon} onPress={() => setNewCategoryDraft((current) => ({ ...current, icon }))} style={[styles.emojiChoice, newCategoryDraft.icon === icon && styles.emojiChoiceActive]}><Glyph value={icon} size={20} color={newCategoryDraft.icon === icon ? THEME.primary : THEME.muted} /></Pressable>)}</View>
      <Button onPress={addCategory} icon="plus" styles={styles} isRTL={isRTL} style={styles.modalPrimaryButton} disabled={!newCategoryDraft.label.trim()}>{t.addCategory}</Button>
    </ModalShell>
  );

  const renderCategoryManager = () => (
    <ModalShell styles={styles} visible={modal === 'categories'} onClose={() => setModal(null)} title={t.manageCategoriesTitle}>
      <Button onPress={() => setModal('newCategory')} icon="plus" variant="secondary" styles={styles} isRTL={isRTL} style={styles.addInlineButton}>{t.newCategory}</Button>
      <ScrollView style={styles.managerList}>
        {categories.map((category) => (
          <View key={category.id} style={styles.managerRow}>
            <Glyph value={category.icon} size={19} color={THEME.primary} />
            <Text style={styles.managerName}>{categoryLabel(t, category)}</Text>
            <Pressable onPress={() => removeCategory(category.id)} style={styles.iconButton}><Icon name="trash" size={18} color={THEME.danger} /></Pressable>
          </View>
        ))}
      </ScrollView>
    </ModalShell>
  );

  const renderContactModal = () => (
    <ModalShell styles={styles} visible={modal === 'contact'} onClose={() => setModal(null)} title={t.contact}>
      <View style={styles.contactBrand}><View style={styles.brandMini}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>N</Text></View><View><Text style={styles.contactName}>NziCode</Text><Text style={styles.contactSub}>{t.contactSub}</Text></View></View>
      <Pressable onPress={() => openContact('whatsapp')} style={styles.contactRow}><Icon name="whatsapp" size={19} color={THEME.primary} /><View style={styles.contactMain}><Text style={styles.contactLabel}>{t.contactWhatsapp}</Text><Text style={styles.contactValue}>0919 843 3408</Text></View><Icon name="forward" size={15} color={THEME.faint}  isRTL={isRTL} /></Pressable>
      <Pressable onPress={() => openContact('telegram')} style={styles.contactRow}><Icon name="telegram" size={19} color={THEME.primary} /><View style={styles.contactMain}><Text style={styles.contactLabel}>{t.contactTelegram}</Text><Text style={styles.contactValue}>@NziCode</Text></View><Icon name="forward" size={15} color={THEME.faint}  isRTL={isRTL} /></Pressable>
      <Pressable onPress={() => openContact('email')} style={styles.contactRow}><Icon name="envelope" size={17} color={THEME.primary} /><View style={styles.contactMain}><Text style={styles.contactLabel}>{t.contactEmail}</Text><Text style={styles.contactValue}>nazari.moradkhani@gmail.com</Text></View><Icon name="forward" size={15} color={THEME.faint}  isRTL={isRTL} /></Pressable>
    </ModalShell>
  );

  const renderEditProfileModal = () => (
    <ModalShell styles={styles} visible={modal === 'editProfile'} onClose={() => setModal(null)} title={t.editProfile}>
      <TextInput value={onboardingDraft.name} onChangeText={(name) => setOnboardingDraft((current) => ({ ...current, name }))} placeholder={t.namePlaceholder} placeholderTextColor={THEME.faint} style={styles.input} textAlign={isRTL ? 'right' : 'left'} autoFocus />
      <Button onPress={() => { setSetup((current) => ({ ...current, userName: onboardingDraft.name.trim() || current.userName })); setModal(null); }} icon="check" styles={styles} isRTL={isRTL} style={styles.modalPrimaryButton}>{t.save}</Button>
    </ModalShell>
  );

  const renderChoiceModal = (kind) => {
    const isCurrency = kind === 'currency';
    const choices = isCurrency ? ['toman', 'rial'] : ['fa', 'en'];
    const labelFor = (choice) => {
      if (isCurrency) return choice === 'toman' ? t.toman : t.rial;
      return choice === 'fa' ? t.farsi : t.english;
    };
    return (
      <ModalShell styles={styles} visible={modal === kind} onClose={() => setModal(null)} title={isCurrency ? t.currencyLabel : t.languageLabel}>
        <View style={styles.choiceList}>
          {choices.map((choice) => {
            const active = isCurrency ? setup.currency === choice : setup.language === choice;
            return (
              <Pressable key={choice} onPress={() => {
                if (isCurrency) setSetup((current) => ({ ...current, currency: choice }));
                else setSetup((current) => ({ ...current, language: choice }));
                setModal(null);
              }} style={styles.choiceListRow}>
                <Text style={styles.choiceListText}>{labelFor(choice)}</Text>
                <View style={[styles.radio, active && styles.radioActive]}>{active ? <Icon name="check" size={13} color="#fff" /> : null}</View>
              </Pressable>
            );
          })}
        </View>
      </ModalShell>
    );
  };

  const renderHistory = () => (
    <>
      <ScreenHeader styles={styles} isRTL={isRTL} title={t.previousListsTitle} subtitle={t.previousListsSub(history.length)} onBack={() => setView(lists.length ? 'lists' : 'home')} />
      {history.length ? history.map((record) => (
        <View key={record.id} style={styles.historyRow}>
          <View style={styles.historyIcon}><Icon name="cart" size={19} color={THEME.primary} /></View>
          <View style={styles.historyMain}>
            <Text style={styles.historyName}>{record.listName}</Text>
            <Text style={styles.historyMeta}>{new Date(record.date).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US')} · {t.itemsCount(record.count)}</Text>
          </View>
          <View style={styles.historyActions}>
            <Pressable onPress={() => restoreFromHistory(record)} style={styles.historyActionButton}><Icon name="forward" size={15} color={THEME.primary}  isRTL={isRTL} /></Pressable>
            <Pressable onPress={() => deleteHistoryEntry(record.id)} style={styles.historyActionButton}><Icon name="trash" size={15} color={THEME.danger} /></Pressable>
          </View>
        </View>
      )) : <EmptyState styles={styles} icon="clock-rotate-left" title={t.previousListsEmptyTitle} text={t.previousListsEmptyText} />}
    </>
  );

  const renderProfile = () => (
    <>
      <ScreenHeader styles={styles} isRTL={isRTL} title={t.profileTitle} subtitle={t.profileSubtitle} />
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}><Icon name="profile" size={22} color={THEME.primary} /></View>
        <View style={styles.profileMain}><Text style={styles.profileName}>{setup.userName}</Text><Text style={styles.profileMeta}>{t.memberOf}</Text></View>
        <Pressable onPress={() => { setOnboardingDraft((current) => ({ ...current, name: setup.userName })); setModal('editProfile'); }} style={styles.iconButton}><Icon name="edit" size={17} color={THEME.primary} /></Pressable>
      </View>
      <SectionTitle styles={styles} isRTL={isRTL} title={t.preferences} />
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}><Icon name="bell" size={16} color={THEME.primary} /></View>
          <View style={styles.settingMain}>
            <Text style={styles.settingTitle}>{t.notifications}</Text>
            <Text style={styles.settingSub}>{notifMessage || (setup.notifications ? t.notificationsSubOn : t.notificationsSubOff)}</Text>
          </View>
          <Pressable onPress={toggleNotifications} style={[styles.switch, setup.notifications && styles.switchOn]}><View style={[styles.switchKnob, setup.notifications && styles.switchKnobOn]} /></Pressable>
        </View>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={styles.settingIcon}><Icon name="globe" size={16} color={THEME.primary} /></View>
          <View style={styles.settingMain}><Text style={styles.settingTitle}>{t.offlineNotice}</Text></View>
        </View>
      </View>
      <View style={styles.settingsCard}>
        <Pressable style={styles.settingRow} onPress={() => setModal('language')}>
          <View style={styles.settingIcon}><Glyph value="globe" size={16} color={THEME.primary} /></View>
          <View style={styles.settingMain}><Text style={styles.settingTitle}>{t.languageLabel}</Text><Text style={styles.settingSub}>{setup.language === 'fa' ? t.farsi : t.english}</Text></View>
          <Icon name="forward" size={15} color={THEME.faint}  isRTL={isRTL} />
        </Pressable>
        <Pressable style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => setModal('currency')}>
          <View style={styles.settingIcon}><Icon name="money" size={16} color={THEME.primary} /></View>
          <View style={styles.settingMain}><Text style={styles.settingTitle}>{t.currencyLabel}</Text><Text style={styles.settingSub}>{setup.currency === 'toman' ? t.toman : t.rial}</Text></View>
          <Icon name="forward" size={15} color={THEME.faint}  isRTL={isRTL} />
        </Pressable>
      </View>
      <SectionTitle styles={styles} isRTL={isRTL} title={t.tools} />
      <View style={styles.settingsCard}>
        <Pressable onPress={() => navigate('history')} style={styles.settingRow}>
          <View style={styles.settingIcon}><Icon name="history" size={16} color={THEME.primary} /></View>
          <View style={styles.settingMain}><Text style={styles.settingTitle}>{t.previousLists}</Text></View>
          <Icon name="forward" size={15} color={THEME.faint}  isRTL={isRTL} />
        </Pressable>
        <Pressable onPress={exportBackup} style={styles.settingRow}>
          <View style={styles.settingIcon}><Icon name="share" size={16} color={THEME.primary} /></View>
          <View style={styles.settingMain}><Text style={styles.settingTitle}>{t.backup}</Text><Text style={styles.settingSub}>{t.backupSub}</Text></View>
        </Pressable>
        <Pressable onPress={() => setModal('contact')} style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={styles.settingIcon}><Icon name="envelope" size={16} color={THEME.primary} /></View>
          <View style={styles.settingMain}><Text style={styles.settingTitle}>{t.contact}</Text><Text style={styles.settingSub}>{t.contactSub}</Text></View>
        </Pressable>
      </View>
      <Pressable onPress={resetData} style={styles.resetRow}><Icon name="trash" size={16} color={THEME.danger} /><Text style={styles.resetText}>{t.resetData}</Text></Pressable>
      <Text style={styles.versionText}>{t.version}</Text>
    </>
  );

  const content = view === 'home' ? renderHome()
    : view === 'lists' ? renderLists()
      : view === 'detail' ? renderDetail()
        : view === 'history' ? renderHistory()
          : renderProfile();

  const NAV_ITEMS = [
    { id: 'lists', label: isRTL ? 'لیست‌ها' : 'Lists', icon: 'list' },
    { id: 'home', label: t.homeSubtitle && (isRTL ? 'خانه' : 'Home'), icon: 'home' },
    { id: 'profile', label: isRTL ? 'پروفایل' : 'Profile', icon: 'profile' },
  ];
  const rootTab = ['home', 'lists', 'profile'].includes(view) ? view : null;

  return (
    <SafeAreaView style={styles.appShell}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{content}</ScrollView>
        {rootTab ? (
          <View style={styles.bottomNav}>
            {NAV_ITEMS.map((item) => (
              <Pressable key={item.id} onPress={() => navigate(item.id)} style={styles.navItem}>
                <Icon name={item.icon} size={20} isRTL={isRTL} color={rootTab === item.id ? THEME.primary : THEME.muted} />
                <Text style={[styles.navLabel, rootTab === item.id && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      {renderAddItemModal()}
      {renderNewListModal()}
      {renderJoinListModal()}
      {renderNewCategoryModal()}
      {renderCategoryManager()}
      {renderContactModal()}
      {renderEditProfileModal()}
      {renderChoiceModal('currency')}
      {renderChoiceModal('language')}
    </SafeAreaView>
  );
};

export default App;
