import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import './web-fonts.css';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

/*
 * خریدیار - a small, offline-first shopping list.
 * The visual tokens below are also the base for future NziCode apps.
 */
const THEME = {
  background: '#F5F6FB',
  surface: '#FFFFFF',
  ink: '#1B1D2A',
  muted: '#7C8295',
  faint: '#AAB0C0',
  primary: '#635BEE',
  primaryDark: '#4740BE',
  primarySoft: '#ECEAFF',
  accent: '#FF775C',
  success: '#27B887',
  successSoft: '#DDF8EE',
  line: '#EAEBF2',
  dark: '#24213F',
};

const FONT = 'Vazirmatn';
const STORAGE_KEY = 'kharidyar-state-v3';
const LEGACY_STORAGE_KEY = 'kharidyar-state';
const ALL = 'همه';

const iconChoices = ['🏠', '🏢', '🛠️', '🛒', '🎒', '🚗', '📦', '✨', '🍽️', '🎁', '💼', '🧰'];
const categoryChoices = ['🥛', '🥬', '🥩', '🥖', '🧹', '🧴', '📦', '🍎', '☕', '🐾', '💊', '✨'];
const defaultCategories = [
  { id: 'dairy', name: 'لبنیات', icon: '🥛' },
  { id: 'produce', name: 'میوه و سبزی', icon: '🥬' },
  { id: 'protein', name: 'پروتئینی', icon: '🥩' },
  { id: 'grain', name: 'نان و غلات', icon: '🥖' },
  { id: 'other', name: 'سایر', icon: '📦' },
];
const initialLists = [{ id: 'home', name: 'خرید خانه', icon: '🏠', items: [] }];
const filters = [
  { id: ALL, label: 'همه' },
  { id: 'remaining', label: 'باقی‌مانده' },
  { id: 'done', label: 'خریداری‌شده' },
];

function safeJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readStoredState() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const current = safeJson(window.localStorage.getItem(STORAGE_KEY), null);
    if (current) return current;
    const legacy = safeJson(window.localStorage.getItem(LEGACY_STORAGE_KEY), null);
    if (!legacy) return null;
    return {
      ...legacy,
      lists: Array.isArray(legacy.lists)
        ? legacy.lists.map((list) => ({
          ...list,
          icon: list.icon || list.emoji || '🛒',
          items: Array.isArray(list.items)
            ? list.items.map((item) => ({ ...item, icon: item.icon || '📦' }))
            : [],
        }))
        : initialLists,
      categories: Array.isArray(legacy.categories)
        ? legacy.categories.map((category, index) => ({
          ...category,
          id: category.id || `legacy-category-${index}`,
        }))
        : defaultCategories,
    };
  } catch {
    return null;
  }
}

function writeStoredState(state) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be disabled in private browsing; the app remains usable.
  }
}

function Icon({ name, size = 20, color = THEME.ink }) {
  const glyphs = {
    menu: '☰',
    more: '⋯',
    down: '⌄',
    search: '⌕',
    plus: '+',
    close: '×',
    check: '✓',
    trash: '⌫',
    archive: '▣',
    history: '◷',
    settings: '⚙',
    contact: '♧',
    share: '↗',
    person: '♙',
    list: '☷',
    category: '◈',
    reset: '↺',
    arrow: '‹',
  };
  return <Text style={{ color, fontSize: size, lineHeight: size + 4, fontFamily: FONT }}>{glyphs[name] || '•'}</Text>;
}

export default function App() {
  const [userName, setUserName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [lists, setLists] = useState(initialLists);
  const [activeListId, setActiveListId] = useState('home');
  const [categories, setCategories] = useState(defaultCategories);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState(ALL);
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const [search, setSearch] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [itemCategory, setItemCategory] = useState('سایر');
  const [newListName, setNewListName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('✨');
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [onboarding, setOnboarding] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = readStoredState();
    if (saved) {
      if (saved.userName) {
        setUserName(saved.userName);
        setNameDraft(saved.userName);
        setOnboarding(false);
      }
      if (Array.isArray(saved.lists) && saved.lists.length) {
        const normalizedLists = saved.lists.map((list) => ({
          ...list,
          icon: list.icon || list.emoji || '🛒',
          items: Array.isArray(list.items) ? list.items.map((item) => ({ ...item, icon: item.icon || '📦' })) : [],
        }));
        setLists(normalizedLists);
        if (saved.activeListId && normalizedLists.some((list) => list.id === saved.activeListId)) {
          setActiveListId(saved.activeListId);
        } else {
          setActiveListId(normalizedLists[0].id);
        }
      }
      if (Array.isArray(saved.categories) && saved.categories.length) {
        setCategories(saved.categories.map((category, index) => ({ ...category, id: category.id || `category-${index}` })));
      }
      if (Array.isArray(saved.history)) setHistory(saved.history);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStoredState({ userName, lists, categories, history, activeListId });
  }, [hydrated, userName, lists, categories, history, activeListId]);

  const activeList = lists.find((list) => list.id === activeListId) || lists[0] || initialLists[0];
  const activeItems = activeList.items || [];
  const remaining = activeItems.filter((item) => !item.done).length;
  const completed = activeItems.length - remaining;
  const progress = activeItems.length ? Math.round((completed / activeItems.length) * 100) : 0;

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeItems
      .filter((item) => {
        const matchesSearch = !query || item.name.toLowerCase().includes(query);
        const matchesCategory = selectedCategory === ALL || item.category === selectedCategory;
        const matchesFilter = filter === ALL || (filter === 'remaining' ? !item.done : item.done);
        return matchesSearch && matchesCategory && matchesFilter;
      })
      .sort((a, b) => Number(a.done) - Number(b.done));
  }, [activeItems, filter, search, selectedCategory]);

  function updateActiveItems(nextItems) {
    setLists((current) => current.map((list) => (
      list.id === activeList.id ? { ...list, items: nextItems } : list
    )));
  }

  function toggleItem(id) {
    const target = activeItems.find((item) => item.id === id);
    if (!target) return;
    const next = activeItems.map((item) => item.id === id ? { ...item, done: !item.done } : item);
    // Completed item is deliberately moved to the end of the source list.
    if (!target.done) {
      const changed = next.find((item) => item.id === id);
      updateActiveItems([...next.filter((item) => item.id !== id), changed]);
    } else {
      const changed = next.find((item) => item.id === id);
      updateActiveItems([changed, ...next.filter((item) => item.id !== id)]);
    }
  }

  function addItem() {
    const name = itemName.trim();
    if (!name) return;
    const category = categories.find((entry) => entry.name === itemCategory) || categories[categories.length - 1];
    updateActiveItems([
      ...activeItems,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        quantity: quantity.trim() || '۱ عدد',
        category: category?.name || 'سایر',
        icon: category?.icon || '📦',
        done: false,
      },
    ]);
    setItemName('');
    setQuantity('');
    setItemCategory(category?.name || 'سایر');
    setAddOpen(false);
  }

  function removeItem(id) {
    updateActiveItems(activeItems.filter((item) => item.id !== id));
  }

  function confirmRemove(item) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`«${item.name}» حذف شود؟`)) removeItem(item.id);
      return;
    }
    Alert.alert('حذف کالا', `«${item.name}» حذف شود؟`, [
      { text: 'لغو', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => removeItem(item.id) },
    ]);
  }

  function addCategory() {
    const name = newCategoryName.trim();
    if (!name || categories.some((entry) => entry.name === name)) return;
    setCategories((current) => [...current, {
      id: `${Date.now()}`,
      name,
      icon: selectedIcon,
    }]);
    setNewCategoryName('');
    setSelectedIcon('✨');
  }

  function deleteCategory(category) {
    if (category.name === 'سایر') return;
    setCategories((current) => current.filter((entry) => entry.id !== category.id));
    if (selectedCategory === category.name) setSelectedCategory(ALL);
    if (itemCategory === category.name) setItemCategory('سایر');
  }

  function addList() {
    const name = newListName.trim();
    if (!name) return;
    const newList = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      icon: selectedIcon,
      items: [],
    };
    setLists((current) => [...current, newList]);
    setActiveListId(newList.id);
    setNewListName('');
    setSelectedIcon('✨');
    setNewListOpen(false);
    setListsOpen(false);
  }

  function archiveList() {
    if (!activeItems.length) {
      setMenuOpen(false);
      return;
    }
    setHistory((current) => [{
      id: `${Date.now()}`,
      listName: activeList.name,
      icon: activeList.icon,
      date: new Date().toLocaleDateString('fa-IR'),
      count: activeItems.length,
      items: activeItems,
    }, ...current]);
    updateActiveItems([]);
    setMenuOpen(false);
  }

  async function shareList() {
    const message = `${activeList.icon} ${activeList.name}\n${activeItems.length ? activeItems.map((item) => `${item.done ? '✓' : '□'} ${item.name} (${item.quantity})`).join('\n') : 'لیست خالی است'}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: activeList.name, text: message });
      } else {
        await Share.share({ message });
      }
    } catch {
      // User cancellation is expected; no error screen is needed.
    }
    setMenuOpen(false);
  }

  function openContact(url) {
    try {
      const result = Linking.openURL(url);
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      // A missing URL handler should never blank the app.
    }
  }

  function saveProfile() {
    const next = nameDraft.trim();
    if (!next) return;
    setUserName(next);
    setProfileOpen(false);
  }

  function resetApp() {
    const doReset = () => {
      setUserName('');
      setNameDraft('');
      setLists(initialLists);
      setCategories(defaultCategories);
      setHistory([]);
      setActiveListId('home');
      setOnboarding(true);
      setProfileOpen(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // Storage can be disabled; resetting in-memory state still works.
        }
      }
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('همه اطلاعات خریدیار پاک شود؟')) doReset();
    } else {
      Alert.alert('پاک‌کردن اطلاعات', 'همه لیست‌ها و تنظیمات پاک شود؟', [
        { text: 'لغو', style: 'cancel' },
        { text: 'پاک کردن', style: 'destructive', onPress: doReset },
      ]);
    }
  }

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingIcon}>🛒</Text>
          <Text style={styles.loadingText}>در حال آماده‌سازی خریدیار…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (onboarding) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
        <View style={styles.welcome}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>✓</Text></View>
          <Text style={styles.welcomeBrand}>خریدیار</Text>
          <Text style={styles.welcomeTitle}>خریدت را ساده و مرتب مدیریت کن</Text>
          <Text style={styles.welcomeSub}>برای شروع، نامت را وارد کن</Text>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="نام شما"
            placeholderTextColor={THEME.faint}
            style={styles.welcomeInput}
            textAlign="right"
            autoFocus
            onSubmitEditing={() => nameDraft.trim() && (setUserName(nameDraft.trim()), setOnboarding(false))}
          />
          <Pressable
            onPress={() => nameDraft.trim() && (setUserName(nameDraft.trim()), setOnboarding(false))}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>شروع کنیم</Text>
            <Icon name="arrow" size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.powered}>ساخته‌شده با ❤️ توسط NziCode</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryData = [{ id: 'all', name: ALL, icon: '✦' }, ...categories];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.greeting}>سلام {userName} 👋</Text>
                <Text style={styles.subtitle}>امروز چه چیزی لازم داری؟</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable onPress={() => setMenuOpen(true)} style={styles.iconButton} accessibilityLabel="منو">
                  <Icon name="menu" size={23} color={THEME.primary} />
                </Pressable>
                <Pressable onPress={() => setProfileOpen(true)} style={styles.profileButton} accessibilityLabel="پروفایل">
                  <Icon name="person" size={23} color={THEME.primary} />
                </Pressable>
              </View>
            </View>

            <Pressable onPress={() => setListsOpen(true)} style={styles.listSelector}>
              <Icon name="down" size={22} color={THEME.primary} />
              <View style={styles.listSelectorCopy}>
                <Text style={styles.listSelectorLabel}>لیست فعال</Text>
                <Text style={styles.listSelectorName}>{activeList.icon} {activeList.name}</Text>
              </View>
            </Pressable>

            <View style={styles.summary}>
              <View style={styles.summaryTop}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressPercent}>{progress}٪</Text>
                  <View style={[styles.progressSlice, { width: `${Math.max(progress, 7)}%` }]} />
                </View>
                <View style={styles.summaryCopy}>
                  <Text style={styles.summaryTitle}>پیشرفت لیست</Text>
                  <Text style={styles.summaryCaption}>
                    {remaining ? `${remaining} قلم تا پایان باقی مانده` : activeItems.length ? 'همه‌چیز انجام شد 🎉' : 'هنوز چیزی اضافه نشده'}
                  </Text>
                </View>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
              <View style={styles.stats}>
                <Text style={styles.stat}>{activeItems.length} قلم</Text>
                <Text style={styles.stat}>{completed} انجام‌شده</Text>
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>اقلام خرید</Text>
              <Text style={styles.counter}>{activeItems.length} قلم</Text>
            </View>

            <View style={styles.searchBox}>
              <Icon name="search" size={25} color={THEME.primary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="جست‌وجوی کالا…"
                placeholderTextColor={THEME.faint}
                style={styles.searchInput}
                textAlign="right"
              />
            </View>

            <View style={styles.filterRow}>
              {filters.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => setFilter(entry.id)}
                  style={[styles.filter, filter === entry.id && styles.filterActive]}
                >
                  <Text style={[styles.filterText, filter === entry.id && styles.filterTextActive]}>{entry.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.categoryHeader}>
              <Text style={styles.categoryLabel}>دسته‌بندی</Text>
              <Pressable onPress={() => setCategoryOpen(true)} style={styles.addCategoryAction}>
                <Icon name="plus" size={17} color={THEME.primary} />
                <Text style={styles.addCategoryText}>مدیریت</Text>
              </Pressable>
            </View>
            <FlatList
              data={categoryData}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedCategory(item.name)}
                  style={[styles.chip, selectedCategory === item.name && styles.chipActive]}
                >
                  <Text style={styles.chipEmoji}>{item.icon}</Text>
                  <Text style={[styles.chipText, selectedCategory === item.name && styles.chipTextActive]}>{item.name}</Text>
                </Pressable>
              )}
            />
          </>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggleItem(item.id)}
            onLongPress={() => confirmRemove(item)}
            style={[styles.item, item.done && styles.itemDone]}
            accessibilityLabel={`تغییر وضعیت ${item.name}`}
          >
            <View style={[styles.itemIcon, item.done && styles.itemIconDone]}><Text style={styles.itemEmoji}>{item.icon || '📦'}</Text></View>
            <View style={styles.itemCopy}>
              <Text style={[styles.itemName, item.done && styles.itemNameDone]}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.category}  •  {item.quantity}</Text>
            </View>
            <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
              {item.done && <Icon name="check" size={17} color="#FFF" />}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}><Icon name="list" size={30} color={THEME.primary} /></View>
            <Text style={styles.emptyTitle}>{search || selectedCategory !== ALL || filter !== ALL ? 'موردی پیدا نشد' : 'لیستت هنوز خالی است'}</Text>
            <Text style={styles.emptySub}>{search || selectedCategory !== ALL || filter !== ALL ? 'فیلتر یا عبارت جست‌وجو را تغییر بده' : 'اولین کالا را با دکمه پایین اضافه کن'}</Text>
          </View>
        )}
        ListFooterComponent={<View style={styles.footer}><Text style={styles.footerText}>خریدیار · NziCode</Text></View>}
      />

      <Pressable onPress={() => setAddOpen(true)} style={styles.fab} accessibilityLabel="افزودن کالا">
        <Icon name="plus" size={25} color="#FFF" />
        <Text style={styles.fabText}>افزودن کالا</Text>
      </Pressable>

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismiss} onPress={() => setAddOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setAddOpen(false)}><Icon name="close" size={27} color={THEME.muted} /></Pressable>
              <Text style={styles.sheetTitle}>افزودن به لیست</Text>
            </View>
            <TextInput value={itemName} onChangeText={setItemName} placeholder="نام کالا" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" autoFocus />
            <TextInput value={quantity} onChangeText={setQuantity} placeholder="مقدار، مثلاً ۲ عدد" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" />
            <Text style={styles.modalLabel}>دسته‌بندی کالا</Text>
            <FlatList
              data={categories}
              horizontal
              inverted
              keyExtractor={(entry) => entry.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalChips}
              renderItem={({ item }) => (
                <Pressable onPress={() => setItemCategory(item.name)} style={[styles.modalChip, itemCategory === item.name && styles.modalChipActive]}>
                  <Text>{item.icon}</Text><Text style={styles.modalChipText}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Pressable onPress={addItem} style={styles.save}><Text style={styles.saveText}>افزودن کالا</Text><Icon name="plus" size={19} color="#FFF" /></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={listsOpen} transparent animationType="slide" onRequestClose={() => setListsOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismiss} onPress={() => setListsOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}><Pressable onPress={() => setListsOpen(false)}><Icon name="close" size={27} color={THEME.muted} /></Pressable><Text style={styles.sheetTitle}>لیست‌های من</Text></View>
            {lists.map((list) => (
              <Pressable key={list.id} onPress={() => { setActiveListId(list.id); setListsOpen(false); }} style={[styles.listRow, list.id === activeList.id && styles.listRowActive]}>
                <Text style={styles.listCount}>{list.items.length} قلم</Text>
                <Text style={styles.menuText}>{list.icon} {list.name}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setNewListOpen(true)} style={styles.newListButton}><Icon name="plus" size={18} color="#FFF" /><Text style={styles.saveText}>ساخت لیست جدید</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={newListOpen} transparent animationType="fade" onRequestClose={() => setNewListOpen(false)}>
        <View style={styles.centerBackdrop}>
          <View style={styles.dialog}>
            <View style={styles.sheetHeader}><Pressable onPress={() => setNewListOpen(false)}><Icon name="close" size={27} color={THEME.muted} /></Pressable><Text style={styles.sheetTitle}>ساخت لیست جدید</Text></View>
            <TextInput value={newListName} onChangeText={setNewListName} placeholder="مثلاً شرکت یا کارگاه" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" />
            <Text style={styles.modalLabel}>آیکون لیست</Text>
            <View style={styles.emojiRow}>{iconChoices.map((icon) => <Pressable key={icon} onPress={() => setSelectedIcon(icon)} style={[styles.emojiButton, selectedIcon === icon && styles.emojiSelected]}><Text style={styles.emojiText}>{icon}</Text></Pressable>)}</View>
            <Pressable onPress={addList} style={styles.save}><Text style={styles.saveText}>ساخت لیست</Text><Icon name="plus" size={19} color="#FFF" /></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismiss} onPress={() => setMenuOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>منوی خریدیار</Text>
            <Pressable style={styles.menuRow} onPress={() => { setMenuOpen(false); setListsOpen(true); }}><Icon name="list" size={21} color={THEME.primary} /><Text style={styles.menuText}>لیست‌های من</Text></Pressable>
            <Pressable style={styles.menuRow} onPress={() => { setMenuOpen(false); setCategoryOpen(true); }}><Icon name="category" size={21} color={THEME.primary} /><Text style={styles.menuText}>مدیریت دسته‌بندی‌ها</Text></Pressable>
            <Pressable style={styles.menuRow} onPress={() => { setMenuOpen(false); setHistoryOpen(true); }}><Icon name="history" size={21} color={THEME.primary} /><Text style={styles.menuText}>لیست‌های خرید قبلی</Text></Pressable>
            <Pressable style={styles.menuRow} onPress={archiveList}><Icon name="archive" size={21} color={THEME.primary} /><Text style={styles.menuText}>آرشیو لیست فعلی</Text></Pressable>
            <Pressable style={styles.menuRow} onPress={shareList}><Icon name="share" size={21} color={THEME.primary} /><Text style={styles.menuText}>اشتراک‌گذاری لیست</Text></Pressable>
            <Pressable style={styles.menuRow} onPress={() => { setMenuOpen(false); setContactOpen(true); }}><Icon name="contact" size={21} color={THEME.primary} /><Text style={styles.menuText}>تماس با ما و درباره NziCode</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={categoryOpen} transparent animationType="slide" onRequestClose={() => setCategoryOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismiss} onPress={() => setCategoryOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}><Pressable onPress={() => setCategoryOpen(false)}><Icon name="close" size={27} color={THEME.muted} /></Pressable><Text style={styles.sheetTitle}>مدیریت دسته‌بندی‌ها</Text></View>
            <TextInput value={newCategoryName} onChangeText={setNewCategoryName} placeholder="نام دسته‌بندی جدید" placeholderTextColor={THEME.faint} style={styles.input} textAlign="right" />
            <Text style={styles.modalLabel}>انتخاب آیکون</Text>
            <View style={styles.emojiRow}>{categoryChoices.map((icon) => <Pressable key={icon} onPress={() => setSelectedIcon(icon)} style={[styles.emojiButton, selectedIcon === icon && styles.emojiSelected]}><Text style={styles.emojiText}>{icon}</Text></Pressable>)}</View>
            <Pressable onPress={addCategory} style={styles.save}><Text style={styles.saveText}>افزودن دسته‌بندی</Text><Icon name="plus" size={19} color="#FFF" /></Pressable>
            <Text style={styles.modalLabel}>دسته‌های فعلی</Text>
            {categories.map((category) => (
              <View key={category.id} style={styles.manageRow}>
                <Pressable onPress={() => deleteCategory(category)} disabled={category.name === 'سایر'} style={styles.deleteCategory}><Icon name="trash" size={17} color={category.name === 'سایر' ? THEME.faint : THEME.accent} /></Pressable>
                <Text style={styles.manageText}>{category.icon} {category.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismiss} onPress={() => setHistoryOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}><Pressable onPress={() => setHistoryOpen(false)}><Icon name="close" size={27} color={THEME.muted} /></Pressable><Text style={styles.sheetTitle}>لیست‌های قبلی</Text></View>
            {history.length ? history.map((entry) => <View key={entry.id} style={styles.historyRow}><Text style={styles.historyDate}>{entry.date} · {entry.count} قلم</Text><Text style={styles.menuText}>{entry.icon || '📦'} {entry.listName}</Text></View>) : <Text style={styles.empty}>هنوز لیستی آرشیو نشده است.</Text>}
          </View>
        </View>
      </Modal>

      <Modal visible={contactOpen} transparent animationType="fade" onRequestClose={() => setContactOpen(false)}>
        <View style={styles.centerBackdrop}>
          <View style={styles.contactDialog}>
            <View style={styles.sheetHeader}><Pressable onPress={() => setContactOpen(false)}><Icon name="close" size={27} color="#C8C5FF" /></Pressable><Text style={styles.contactTitle}>ارتباط با ما</Text></View>
            <Text style={styles.contactBrand}>NziCode</Text>
            <Text style={styles.contactName}>محمد علی نظری</Text>
            <Pressable onPress={() => openContact('https://wa.me/989198433408')} style={styles.contactLine}><Text style={styles.contactValue}>واتساپ  09198433408</Text><Text style={styles.contactGlyph}>◉</Text></Pressable>
            <Pressable onPress={() => openContact('mailto:nazari.moradkhani@gmail.com')} style={styles.contactLine}><Text style={styles.contactValue}>nazari.moradkhani@gmail.com</Text><Text style={styles.contactGlyph}>✉</Text></Pressable>
            <Pressable onPress={() => openContact('https://t.me/NziCode')} style={styles.contactLine}><Text style={styles.contactValue}>تلگرام  NziCode</Text><Text style={styles.contactGlyph}>➤</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={profileOpen} transparent animationType="fade" onRequestClose={() => setProfileOpen(false)}>
        <View style={styles.centerBackdrop}>
          <View style={styles.dialog}>
            <View style={styles.sheetHeader}><Pressable onPress={() => setProfileOpen(false)}><Icon name="close" size={27} color={THEME.muted} /></Pressable><Text style={styles.sheetTitle}>پروفایل</Text></View>
            <Text style={styles.modalLabel}>نام شما</Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} style={styles.input} textAlign="right" />
            <Pressable onPress={saveProfile} style={styles.save}><Text style={styles.saveText}>ذخیره نام</Text></Pressable>
            <Pressable onPress={resetApp} style={styles.resetButton}><Icon name="reset" size={18} color={THEME.accent} /><Text style={styles.resetText}>پاک‌کردن همه اطلاعات</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  container: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 108 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingIcon: { fontSize: 48 },
  loadingText: { marginTop: 12, color: THEME.muted, fontFamily: FONT, fontSize: 13 },
  welcome: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 26 },
  brandMark: { width: 82, height: 82, borderRadius: 27, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  brandMarkText: { color: '#FFF', fontSize: 45, fontWeight: '900', fontFamily: FONT, transform: [{ rotate: '8deg' }] },
  welcomeBrand: { color: THEME.primary, fontSize: 30, fontWeight: '900', fontFamily: FONT, marginTop: 18 },
  welcomeTitle: { color: THEME.ink, fontSize: 19, fontWeight: '900', fontFamily: FONT, marginTop: 18, textAlign: 'center' },
  welcomeSub: { color: THEME.muted, fontSize: 13, fontFamily: FONT, marginTop: 8, marginBottom: 22 },
  welcomeInput: { width: '100%', backgroundColor: THEME.surface, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 14, color: THEME.ink, fontFamily: FONT, borderWidth: 1, borderColor: THEME.line },
  primaryButton: { width: '100%', backgroundColor: THEME.primary, borderRadius: 16, paddingVertical: 15, marginTop: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '900', fontFamily: FONT },
  powered: { color: THEME.faint, fontSize: 11, fontFamily: FONT, marginTop: 28 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerCopy: { alignItems: 'flex-end', flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8, marginRight: 13 },
  greeting: { color: THEME.ink, fontSize: 21, fontWeight: '900', fontFamily: FONT },
  subtitle: { color: THEME.muted, fontSize: 12, fontFamily: FONT, marginTop: 5 },
  iconButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: THEME.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.line },
  profileButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  listSelector: { backgroundColor: THEME.surface, borderRadius: 17, paddingHorizontal: 15, paddingVertical: 13, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderWidth: 1, borderColor: THEME.line },
  listSelectorCopy: { alignItems: 'flex-end' },
  listSelectorLabel: { color: THEME.faint, fontSize: 10, fontFamily: FONT },
  listSelectorName: { color: THEME.ink, fontSize: 15, fontWeight: '900', fontFamily: FONT, marginTop: 3 },
  summary: { backgroundColor: THEME.dark, borderRadius: 25, padding: 18, marginBottom: 22 },
  summaryTop: { flexDirection: 'row-reverse', alignItems: 'center' },
  summaryCopy: { flex: 1, alignItems: 'flex-end', marginRight: 13 },
  summaryTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', fontFamily: FONT },
  summaryCaption: { color: '#C9C5FA', fontSize: 12, fontFamily: FONT, marginTop: 5 },
  progressCircle: { width: 66, height: 66, borderRadius: 22, backgroundColor: '#403A67', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  progressSlice: { position: 'absolute', left: 0, bottom: 0, height: 7, backgroundColor: '#B8B1FF' },
  progressPercent: { color: '#FFF', fontSize: 14, fontWeight: '900', fontFamily: FONT, zIndex: 2 },
  track: { height: 7, backgroundColor: '#454066', borderRadius: 8, overflow: 'hidden', marginTop: 17 },
  fill: { height: 7, backgroundColor: '#B8B1FF', borderRadius: 8 },
  stats: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12 },
  stat: { color: '#B9B4E1', fontSize: 11, fontFamily: FONT },
  sectionRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: THEME.ink, fontSize: 18, fontWeight: '900', fontFamily: FONT },
  counter: { color: THEME.muted, fontSize: 12, fontFamily: FONT },
  searchBox: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 15, paddingHorizontal: 12, borderWidth: 1, borderColor: THEME.line, marginBottom: 10 },
  searchInput: { flex: 1, paddingVertical: 12, color: THEME.ink, fontFamily: FONT, fontSize: 13 },
  filterRow: { flexDirection: 'row-reverse', backgroundColor: '#E9EAF2', borderRadius: 14, padding: 3 },
  filter: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  filterActive: { backgroundColor: THEME.surface },
  filterText: { color: THEME.muted, fontSize: 11, fontFamily: FONT },
  filterTextActive: { color: THEME.primary, fontWeight: '900' },
  categoryHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  categoryLabel: { color: '#565C70', fontSize: 13, fontWeight: '900', fontFamily: FONT },
  addCategoryAction: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  addCategoryText: { color: THEME.primary, fontSize: 12, fontWeight: '900', fontFamily: FONT },
  chips: { gap: 8, paddingVertical: 10 },
  chip: { backgroundColor: THEME.surface, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row-reverse', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: THEME.line },
  chipActive: { backgroundColor: THEME.primarySoft, borderColor: '#D3CEFF' },
  chipEmoji: { fontSize: 14 },
  chipText: { color: THEME.muted, fontSize: 11, fontFamily: FONT },
  chipTextActive: { color: THEME.primary, fontWeight: '900' },
  item: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 17, padding: 11, marginBottom: 8, borderWidth: 1, borderColor: THEME.line },
  itemDone: { opacity: 0.78, backgroundColor: '#FBFBFD' },
  itemIcon: { width: 41, height: 41, borderRadius: 14, backgroundColor: '#F0F1F7', alignItems: 'center', justifyContent: 'center' },
  itemIconDone: { backgroundColor: THEME.successSoft },
  itemEmoji: { fontSize: 21 },
  itemCopy: { flex: 1, alignItems: 'flex-end', marginRight: 10 },
  itemName: { color: THEME.ink, fontSize: 14, fontWeight: '900', fontFamily: FONT },
  itemNameDone: { textDecorationLine: 'line-through', color: THEME.faint },
  itemMeta: { color: THEME.muted, fontSize: 10, marginTop: 4, fontFamily: FONT },
  checkbox: { width: 25, height: 25, borderRadius: 9, borderWidth: 1.5, borderColor: '#D5D8E3', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  checkboxDone: { backgroundColor: THEME.success, borderColor: THEME.success },
  emptyBox: { alignItems: 'center', paddingVertical: 38 },
  emptyIcon: { width: 62, height: 62, borderRadius: 22, backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#575D70', fontSize: 14, fontWeight: '900', fontFamily: FONT, marginTop: 12 },
  emptySub: { color: THEME.faint, fontSize: 11, fontFamily: FONT, marginTop: 5 },
  empty: { textAlign: 'center', color: THEME.muted, fontFamily: FONT, padding: 22 },
  footer: { alignItems: 'center', paddingTop: 20 },
  footerText: { color: THEME.faint, fontSize: 10, fontFamily: FONT },
  fab: { position: 'absolute', bottom: 20, left: 18, right: 18, height: 57, borderRadius: 18, backgroundColor: THEME.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, elevation: 6 },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '900', fontFamily: FONT },
  backdrop: { flex: 1, backgroundColor: 'rgba(21,20,40,.48)', justifyContent: 'flex-end' },
  centerBackdrop: { flex: 1, backgroundColor: 'rgba(21,20,40,.48)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  dismiss: { flex: 1 },
  sheet: { backgroundColor: THEME.surface, borderTopLeftRadius: 29, borderTopRightRadius: 29, padding: 20, paddingBottom: 27, maxHeight: '86%' },
  dialog: { width: '100%', backgroundColor: THEME.surface, borderRadius: 24, padding: 20 },
  contactDialog: { width: '100%', backgroundColor: THEME.dark, borderRadius: 24, padding: 20 },
  handle: { width: 42, height: 5, borderRadius: 5, backgroundColor: '#D9DBE4', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { color: THEME.ink, fontSize: 18, fontWeight: '900', fontFamily: FONT },
  input: { backgroundColor: '#F5F6FA', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: THEME.ink, fontFamily: FONT, fontSize: 13, marginBottom: 10, borderWidth: 1, borderColor: THEME.line },
  save: { backgroundColor: THEME.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 7, paddingVertical: 14, marginTop: 10 },
  saveText: { color: '#FFF', fontSize: 13, fontWeight: '900', fontFamily: FONT },
  modalLabel: { color: '#5C6274', fontSize: 12, fontWeight: '900', fontFamily: FONT, textAlign: 'right', marginTop: 2, marginBottom: 8 },
  modalChips: { gap: 7, paddingBottom: 3 },
  modalChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F5F6FA', borderWidth: 1, borderColor: THEME.line },
  modalChipActive: { backgroundColor: THEME.primarySoft, borderColor: THEME.primary },
  modalChipText: { color: THEME.muted, fontSize: 10, fontFamily: FONT },
  listRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: THEME.line },
  listRowActive: { backgroundColor: '#FAFAFF' },
  listCount: { color: THEME.primary, fontSize: 11, fontWeight: '900', fontFamily: FONT },
  menuText: { color: THEME.ink, fontSize: 13, fontWeight: '800', fontFamily: FONT },
  newListButton: { backgroundColor: THEME.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 6, padding: 13, marginTop: 15 },
  emojiRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  emojiButton: { width: 39, height: 39, borderRadius: 12, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.line },
  emojiSelected: { backgroundColor: THEME.primarySoft, borderColor: THEME.primary },
  emojiText: { fontSize: 20 },
  menuRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: THEME.line },
  manageRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  manageText: { color: '#35394A', fontSize: 13, fontFamily: FONT, textAlign: 'right' },
  deleteCategory: { padding: 5 },
  historyRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: THEME.line },
  historyDate: { color: THEME.muted, fontSize: 10, fontFamily: FONT },
  contactTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', fontFamily: FONT },
  contactBrand: { color: '#BDB7FF', fontSize: 24, fontWeight: '900', fontFamily: FONT, textAlign: 'right', marginTop: 5 },
  contactName: { color: '#FFF', fontSize: 13, fontFamily: FONT, textAlign: 'right', marginTop: 4, marginBottom: 15 },
  contactLine: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#403B62' },
  contactValue: { color: '#FFF', fontSize: 12, fontFamily: FONT },
  contactGlyph: { color: '#BDB7FF', fontSize: 18 },
  resetButton: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 13, marginTop: 12, borderRadius: 13, backgroundColor: '#FFF3EF' },
  resetText: { color: THEME.accent, fontSize: 12, fontWeight: '900', fontFamily: FONT },
});
