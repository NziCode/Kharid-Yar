import React, { useMemo, useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable, SafeAreaView, Share, StatusBar,
  StyleSheet, Text, TextInput, View,
} from 'react-native';

const initialLists = [
  { id: 'home', name: 'خرید خانه', emoji: '🏠', items: [
    { id: '1', name: 'شیر کم‌چرب', category: 'لبنیات', icon: '🥛', quantity: '۲ عدد', done: false },
    { id: '2', name: 'نان سنگک', category: 'نان و غلات', icon: '🥖', quantity: '۱ عدد', done: true },
    { id: '3', name: 'تخم مرغ', category: 'پروتئینی', icon: '🥚', quantity: '۱ شانه', done: false },
  ] },
  { id: 'work', name: 'لوازم شرکت', emoji: '💼', items: [] },
];

const defaultCategories = [
  { name: 'لبنیات', icon: '🥛' }, { name: 'میوه و سبزی', icon: '🥬' },
  { name: 'پروتئینی', icon: '🥩' }, { name: 'نان و غلات', icon: '🥖' },
];
const emojis = ['🥛', '🥬', '🥩', '🥖', '🧹', '🧴', '📦', '✨', '🍎', '☕'];
const filters = ['همه', 'باقی‌مانده', 'خریداری‌شده'];

export default function App() {
  const [userName, setUserName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [lists, setLists] = useState(initialLists);
  const [activeListId, setActiveListId] = useState('home');
  const [categories, setCategories] = useState(defaultCategories);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('همه');
  const [selectedCategory, setSelectedCategory] = useState('همه');
  const [search, setSearch] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('✨');
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [onboarding, setOnboarding] = useState(true);

  const activeList = lists.find((list) => list.id === activeListId) || lists[0];
  const activeItems = activeList?.items || [];
  const visibleItems = useMemo(() => activeItems.filter((item) => {
    const textMatch = !search.trim() || item.name.includes(search.trim());
    const categoryMatch = selectedCategory === 'همه' || item.category === selectedCategory;
    const filterMatch = filter === 'همه' || (filter === 'باقی‌مانده' ? !item.done : item.done);
    return textMatch && categoryMatch && filterMatch;
  }).sort((a, b) => Number(a.done) - Number(b.done)), [activeItems, filter, search, selectedCategory]);
  const remaining = activeItems.filter((item) => !item.done).length;
  const completed = activeItems.length - remaining;
  const progress = activeItems.length ? Math.round(completed / activeItems.length * 100) : 0;

  function updateActiveItems(nextItems) {
    setLists((current) => current.map((list) => list.id === activeListId ? { ...list, items: nextItems } : list));
  }
  function toggleItem(id) {
    const next = activeItems.map((item) => item.id === id ? { ...item, done: !item.done } : item);
    const changed = next.find((item) => item.id === id);
    updateActiveItems(changed.done ? [...next.filter((item) => item.id !== id), changed] : [changed, ...next.filter((item) => item.id !== id)]);
  }
  function addItem() {
    if (!itemName.trim()) return;
    updateActiveItems([...activeItems, {
      id: Date.now().toString(), name: itemName.trim(), quantity: quantity.trim() || '۱ عدد',
      category: selectedCategory === 'همه' ? 'سایر' : selectedCategory,
      icon: categories.find((cat) => cat.name === selectedCategory)?.icon || '🛒', done: false,
    }]);
    setItemName(''); setQuantity(''); setAddOpen(false);
  }
  function removeItem(id) { updateActiveItems(activeItems.filter((item) => item.id !== id)); }
  function addCategory() {
    if (!newCategoryName.trim() || categories.some((cat) => cat.name === newCategoryName.trim())) return;
    setCategories([...categories, { name: newCategoryName.trim(), icon: selectedEmoji }]);
    setNewCategoryName('');
  }
  function addList() {
    if (!newListName.trim()) return;
    const id = Date.now().toString();
    setLists([...lists, { id, name: newListName.trim(), emoji: selectedEmoji, items: [] }]);
    setActiveListId(id); setNewListName(''); setNewListOpen(false); setListsOpen(false);
  }
  function archiveList() {
    if (!activeItems.length) return;
    setHistory([{ id: Date.now().toString(), listName: activeList.name, date: new Date().toLocaleDateString('fa-IR'), count: activeItems.length }, ...history]);
    updateActiveItems([]); setMenuOpen(false);
  }
  function shareList() {
    Share.share({ message: `${activeList.name}\n${activeItems.map((item) => `• ${item.name} (${item.quantity})`).join('\n')}` });
  }

  if (onboarding) return (
    <SafeAreaView style={s.safe}>
      <View style={s.welcome}>
        <Text style={s.welcomeEmoji}>🛒</Text>
        <Text style={s.welcomeBrand}>خریدیار</Text>
        <Text style={s.welcomeTitle}>لیست خریدت را هوشمند بساز</Text>
        <Text style={s.welcomeSub}>برای شروع، اسمت را وارد کن</Text>
        <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="نام شما" placeholderTextColor="#A2A6B4" style={s.welcomeInput} />
        <Pressable onPress={() => nameDraft.trim() && (setUserName(nameDraft.trim()), setOnboarding(false))} style={s.primaryButton}><Text style={s.primaryButtonText}>شروع کنیم 🚀</Text></Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5FA" />
      <FlatList data={visibleItems} keyExtractor={(item) => item.id} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}
        ListHeaderComponent={<>
            <View style={s.header}><View style={s.headerCopy}><Text style={s.greeting}>سلام {userName} 👋</Text><Text style={s.subtitle}>امروز چه چیزی لازم داری؟</Text></View><View style={s.headerActions}><Pressable onPress={() => setMenuOpen(true)} style={s.icon}><Text style={s.iconText}>☰</Text></Pressable><View style={s.avatar}><Text style={s.avatarText}>{userName.slice(0, 1)}</Text></View></View></View>
          <Pressable onPress={() => setListsOpen(true)} style={s.listSelector}><Text style={s.chevron}>⌄</Text><View style={s.listSelectorCopy}><Text style={s.listSelectorLabel}>لیست فعال</Text><Text style={s.listSelectorName}>{activeList.emoji} {activeList.name}</Text></View></Pressable>
          <View style={s.summary}><View style={s.summaryTop}><View style={s.chart}><View style={[s.chartBar, { height: `${Math.max(progress, 8)}%` }]} /><Text style={s.chartPercent}>{progress}٪</Text></View><View style={s.summaryCopy}><Text style={s.summaryTitle}>پیشرفت این لیست</Text><Text style={s.summaryCaption}>{remaining ? `${remaining} قلم تا پایان باقی مانده` : 'همه‌چیز انجام شد 🎉'}</Text></View></View><View style={s.track}><View style={[s.fill, { width: `${progress}%` }]} /></View><View style={s.stats}><Text style={s.stat}>{activeItems.length} قلم</Text><Text style={s.stat}>{completed} انجام‌شده</Text></View></View>
          <View style={s.sectionRow}><Text style={s.sectionTitle}>اقلام خرید</Text><Text style={s.counter}>{activeItems.length} قلم</Text></View>
          <View style={s.searchBox}><Text style={s.searchIcon}>⌕</Text><TextInput value={search} onChangeText={setSearch} placeholder="جست‌وجوی کالا..." placeholderTextColor="#A2A6B4" style={s.searchInput} /></View>
          <View style={s.filterRow}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[s.filter, filter === item && s.filterActive]}><Text style={[s.filterText, filter === item && s.filterTextActive]}>{item}</Text></Pressable>)}</View>
          <View style={s.categoryHeader}><Text style={s.categoryLabel}>دسته‌بندی</Text><Pressable onPress={() => setCategoryOpen(true)} style={s.addCategoryAction}><Text style={s.addCategoryPlus}>＋</Text><Text style={s.addCategoryText}>افزودن</Text></Pressable></View>
          <FlatList data={[{ name: 'همه', icon: '✨' }, ...categories]} horizontal inverted showsHorizontalScrollIndicator={false} keyExtractor={(item) => item.name} contentContainerStyle={s.chips} renderItem={({ item }) => <Pressable onPress={() => setSelectedCategory(item.name)} style={[s.chip, selectedCategory === item.name && s.chipActive]}><Text style={s.chipEmoji}>{item.icon}</Text><Text style={[s.chipText, selectedCategory === item.name && s.chipTextActive]}>{item.name}</Text></Pressable>} />
        </>}
        renderItem={({ item }) => <Pressable onPress={() => toggleItem(item.id)} onLongPress={() => Alert.alert('حذف کالا', `«${item.name}» حذف شود؟`, [{ text: 'لغو' }, { text: 'حذف', style: 'destructive', onPress: () => removeItem(item.id) }])} style={s.item}><Text style={s.itemEmoji}>{item.icon || '🛒'}</Text><View style={s.itemCopy}><Text style={[s.itemName, item.done && s.itemNameDone]}>{item.name}</Text><Text style={s.itemMeta}>{item.category} • {item.quantity}</Text></View><View style={[s.checkbox, item.done && s.checkboxDone]}>{item.done && <Text style={s.check}>✓</Text>}</View></Pressable>}
        ListEmptyComponent={<Text style={s.empty}>این لیست هنوز خالی است؛ اولین کالا را اضافه کن ✨</Text>}
        ListFooterComponent={<View style={s.footer}><Pressable onPress={shareList} style={s.footerAction}><Text style={s.footerIcon}>↗</Text><Text style={s.footerLink}>اشتراک‌گذاری لیست</Text></Pressable><Text style={s.footerText}>خریدیار</Text></View>}
      />
      <Pressable onPress={() => setAddOpen(true)} style={s.fab}><Text style={s.fabPlus}>＋</Text><Text style={s.fabText}>افزودن کالا</Text></Pressable>

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setAddOpen(false)} /><View style={s.sheet}><View style={s.handle} /><View style={s.sheetHeader}><Pressable onPress={() => setAddOpen(false)}><Text style={s.close}>×</Text></Pressable><Text style={s.sheetTitle}>افزودن به لیست</Text></View><TextInput value={itemName} onChangeText={setItemName} placeholder="نام کالا" placeholderTextColor="#A4A8B7" style={s.input} autoFocus /><TextInput value={quantity} onChangeText={setQuantity} placeholder="مقدار، مثلاً ۲ عدد" placeholderTextColor="#A4A8B7" style={s.input} /><Pressable onPress={addItem} style={s.save}><Text style={s.saveText}>افزودن به لیست</Text></Pressable></View></View></Modal>
      <Modal visible={listsOpen} transparent animationType="slide" onRequestClose={() => setListsOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setListsOpen(false)} /><View style={s.sheet}><View style={s.handle} /><View style={s.sheetHeader}><Pressable onPress={() => setListsOpen(false)}><Text style={s.close}>×</Text></Pressable><Text style={s.sheetTitle}>لیست‌های من</Text></View>{lists.map((list) => <Pressable key={list.id} onPress={() => { setActiveListId(list.id); setListsOpen(false); }} style={s.listRow}><Text style={s.listCount}>{list.items.length} قلم</Text><Text style={s.menuText}>{list.emoji} {list.name}</Text></Pressable>)}<Pressable onPress={() => setNewListOpen(true)} style={s.newListButton}><Text style={s.saveText}>＋ ساخت لیست جدید</Text></Pressable></View></View></Modal>
      <Modal visible={newListOpen} transparent animationType="fade" onRequestClose={() => setNewListOpen(false)}><View style={s.contactBackdrop}><View style={s.contactModal}><Text style={s.sheetTitle}>ساخت لیست جدید</Text><TextInput value={newListName} onChangeText={setNewListName} placeholder="مثلاً کارگاه" placeholderTextColor="#A4A8B7" style={s.input} /><Text style={s.modalLabel}>آیکون لیست</Text><View style={s.emojiRow}>{emojis.map((emoji) => <Pressable key={emoji} onPress={() => setSelectedEmoji(emoji)} style={[s.emojiButton, selectedEmoji === emoji && s.emojiSelected]}><Text>{emoji}</Text></Pressable>)}</View><Pressable onPress={addList} style={s.save}><Text style={s.saveText}>ساخت لیست</Text></Pressable></View></View></Modal>
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setMenuOpen(false)} /><View style={s.sheet}><View style={s.handle} /><Text style={s.sheetTitle}>منوی خریدیار</Text><Pressable style={s.menuRow} onPress={() => { setMenuOpen(false); setCategoryOpen(true); }}><Text style={s.menuGlyph}>⚙</Text><Text style={s.menuText}>مدیریت دسته‌بندی‌ها</Text></Pressable><Pressable style={s.menuRow} onPress={() => { setMenuOpen(false); setHistoryOpen(true); }}><Text style={s.menuGlyph}>◷</Text><Text style={s.menuText}>لیست‌های خرید قبلی</Text></Pressable><Pressable style={s.menuRow} onPress={archiveList}><Text style={s.menuGlyph}>▣</Text><Text style={s.menuText}>آرشیو لیست فعلی</Text></Pressable></View></View></Modal>
      <Modal visible={categoryOpen} transparent animationType="slide" onRequestClose={() => setCategoryOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setCategoryOpen(false)} /><View style={s.sheet}><View style={s.handle} /><View style={s.sheetHeader}><Pressable onPress={() => setCategoryOpen(false)}><Text style={s.close}>×</Text></Pressable><Text style={s.sheetTitle}>مدیریت دسته‌بندی‌ها</Text></View><TextInput value={newCategoryName} onChangeText={setNewCategoryName} placeholder="نام دسته‌بندی جدید" placeholderTextColor="#A4A8B7" style={s.input} /><View style={s.emojiRow}>{emojis.map((emoji) => <Pressable key={emoji} onPress={() => setSelectedEmoji(emoji)} style={[s.emojiButton, selectedEmoji === emoji && s.emojiSelected]}><Text>{emoji}</Text></Pressable>)}</View><Pressable onPress={addCategory} style={s.save}><Text style={s.saveText}>افزودن دسته‌بندی</Text></Pressable>{categories.map((cat) => <Text key={cat.name} style={s.manageText}>{cat.icon} {cat.name}</Text>)}</View></View></Modal>
      <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setHistoryOpen(false)} /><View style={s.sheet}><View style={s.handle} /><View style={s.sheetHeader}><Pressable onPress={() => setHistoryOpen(false)}><Text style={s.close}>×</Text></Pressable><Text style={s.sheetTitle}>لیست‌های قبلی</Text></View>{history.length ? history.map((entry) => <Text key={entry.id} style={s.manageText}>📅 {entry.date} · {entry.listName} · {entry.count} قلم</Text>) : <Text style={s.empty}>هنوز لیستی آرشیو نشده است.</Text>}</View></View></Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5FA' }, container: { padding: 18, paddingBottom: 105 },
  welcome: { flex: 1, justifyContent: 'center', padding: 26, alignItems: 'center' }, welcomeEmoji: { fontSize: 58 }, welcomeBrand: { color: '#6554E8', fontSize: 28, fontWeight: '900', marginTop: 14 }, welcomeTitle: { color: '#1B1E2D', fontSize: 20, fontWeight: '900', marginTop: 18, textAlign: 'center' }, welcomeSub: { color: '#858B9E', marginTop: 8, marginBottom: 20 }, welcomeInput: { width: '100%', backgroundColor: '#FFF', borderRadius: 14, padding: 15, textAlign: 'right', color: '#22263A' },
  primaryButton: { width: '100%', backgroundColor: '#6554E8', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 12 }, primaryButtonText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 }, headerCopy: { alignItems: 'flex-end' }, headerActions: { flexDirection: 'row', gap: 8 }, greeting: { color: '#171A2A', fontSize: 22, fontWeight: '900' }, subtitle: { color: '#858B9E', fontSize: 12, marginTop: 6 }, icon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, iconText: { color: '#6554E8', fontSize: 20 }, avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#E7E3FF', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#6554E8', fontSize: 19, fontWeight: '900' },
  listSelector: { backgroundColor: '#FFF', borderRadius: 16, padding: 13, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, listSelectorCopy: { alignItems: 'flex-end' }, listSelectorLabel: { color: '#9A9FAE', fontSize: 10 }, listSelectorName: { color: '#272A3B', fontSize: 15, fontWeight: '900', marginTop: 3 }, chevron: { color: '#6554E8', fontSize: 20 },
  summary: { backgroundColor: '#25213F', borderRadius: 24, padding: 18, marginBottom: 22 }, summaryTop: { flexDirection: 'row-reverse', alignItems: 'center' }, summaryCopy: { flex: 1, alignItems: 'flex-end', marginRight: 13 }, summaryTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' }, summaryCaption: { color: '#C2BDF1', fontSize: 12, marginTop: 5 }, chart: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#423B68', alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }, chartBar: { width: '100%', backgroundColor: '#B7AFFF', position: 'absolute', bottom: 0 }, chartPercent: { color: '#FFF', fontSize: 12, fontWeight: '900', zIndex: 1, marginBottom: 20 }, track: { height: 7, backgroundColor: '#464064', borderRadius: 9, overflow: 'hidden', marginTop: 17 }, fill: { height: 7, backgroundColor: '#B7AFFF', borderRadius: 9 }, stats: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12 }, stat: { color: '#AFAAD8', fontSize: 11 },
  sectionRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 }, sectionTitle: { color: '#1C2030', fontSize: 18, fontWeight: '900' }, counter: { color: '#9298A9', fontSize: 12 }, searchBox: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 12, marginBottom: 10 }, searchIcon: { color: '#6554E8', fontSize: 24 }, searchInput: { flex: 1, textAlign: 'right', paddingVertical: 12, color: '#22263A' }, filterRow: { flexDirection: 'row-reverse', backgroundColor: '#E9EAF1', borderRadius: 13, padding: 3 }, filter: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' }, filterActive: { backgroundColor: '#FFF' }, filterText: { color: '#9298A9', fontSize: 11 }, filterTextActive: { color: '#6554E8', fontWeight: '800' },
  categoryHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }, categoryLabel: { color: '#555B6D', fontSize: 13, fontWeight: '800' }, addCategoryAction: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 }, addCategoryText: { color: '#6554E8', fontSize: 12, fontWeight: '800' }, chips: { gap: 8, paddingVertical: 10 }, chip: { backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row-reverse', gap: 4 }, chipActive: { backgroundColor: '#E7E3FF' }, chipEmoji: { fontSize: 13 }, chipText: { color: '#777D90', fontSize: 11 }, chipTextActive: { color: '#6554E8', fontWeight: '800' },
  item: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 8 }, itemEmoji: { fontSize: 23 }, itemCopy: { flex: 1, alignItems: 'flex-end', marginRight: 10 }, itemName: { color: '#25283A', fontSize: 14, fontWeight: '800' }, itemNameDone: { textDecorationLine: 'line-through', color: '#A0A4B1' }, itemMeta: { color: '#9A9FAE', fontSize: 10, marginTop: 5 }, checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: '#D9DCE6', alignItems: 'center', justifyContent: 'center', marginLeft: 9 }, checkboxDone: { backgroundColor: '#52C99A', borderColor: '#52C99A' }, check: { color: '#FFF', fontWeight: '900' }, empty: { textAlign: 'center', color: '#9298A9', padding: 25 },
  footer: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 22 }, footerAction: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }, footerText: { color: '#A0A5B4', fontSize: 10 }, footerLink: { color: '#6554E8', fontSize: 10, fontWeight: '800' }, fab: { position: 'absolute', bottom: 22, right: 18, left: 18, height: 56, borderRadius: 18, backgroundColor: '#6554E8', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 }, fabPlus: { color: '#FFF', fontSize: 25 }, fabText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,19,38,.45)', justifyContent: 'flex-end' }, dismiss: { flex: 1 }, sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28 }, handle: { width: 42, height: 5, borderRadius: 4, backgroundColor: '#D8DAE3', alignSelf: 'center', marginBottom: 14 }, sheetHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }, sheetTitle: { color: '#1D2030', fontSize: 19, fontWeight: '900' }, close: { color: '#8E94A4', fontSize: 28 }, input: { backgroundColor: '#F5F6FA', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, color: '#25283A', textAlign: 'right', marginBottom: 10 }, save: { backgroundColor: '#FF7A59', borderRadius: 14, alignItems: 'center', paddingVertical: 14, marginTop: 8 }, saveText: { color: '#FFF', fontSize: 14, fontWeight: '900' }, menuRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F1F5' }, menuText: { color: '#25283A', fontSize: 14, fontWeight: '800' }, menuArrow: { color: '#6554E8', fontSize: 24 },
  listRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F1F5' }, listCount: { color: '#6554E8', fontSize: 12, fontWeight: '800' }, newListButton: { backgroundColor: '#6554E8', borderRadius: 14, alignItems: 'center', padding: 13, marginTop: 15 }, modalLabel: { color: '#555B6D', textAlign: 'right', marginBottom: 8 }, emojiRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 12 }, emojiButton: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' }, emojiSelected: { backgroundColor: '#E7E3FF', borderWidth: 1, borderColor: '#6554E8' }, manageText: { color: '#35394A', fontSize: 13, paddingVertical: 7, textAlign: 'right' },
  contactBackdrop: { flex: 1, backgroundColor: 'rgba(20,19,38,.45)', alignItems: 'center', justifyContent: 'center', padding: 25 }, contactModal: { width: '100%', backgroundColor: '#25213F', borderRadius: 24, padding: 22, alignItems: 'flex-end' }, historyOpen: {}, historyText: { color: '#FFF' },
});
