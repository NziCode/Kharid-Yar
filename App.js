import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';

const starter = [
  { id: '1', name: 'شیر کم‌چرب', category: 'لبنیات', quantity: '۲ عدد', done: false },
  { id: '2', name: 'نان سنگک', category: 'نان و غلات', quantity: '۱ عدد', done: true },
  { id: '3', name: 'تخم مرغ', category: 'پروتئینی', quantity: '۱ شانه', done: false },
  { id: '4', name: 'گوجه فرنگی', category: 'میوه و سبزی', quantity: '۱ کیلو', done: false },
];
const filters = ['همه', 'باقی‌مانده', 'خریداری‌شده'];

export default function App() {
  const [items, setItems] = useState(starter);
  const [categories, setCategories] = useState(['همه', 'لبنیات', 'میوه و سبزی', 'پروتئینی', 'نان و غلات']);
  const [history, setHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('همه');
  const [filter, setFilter] = useState('همه');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const visible = useMemo(() => items.filter((item) => {
    const categoryMatch = selectedCategory === 'همه' || item.category === selectedCategory;
    const filterMatch = filter === 'همه' || (filter === 'باقی‌مانده' ? !item.done : item.done);
    return categoryMatch && filterMatch;
  }).sort((a, b) => Number(a.done) - Number(b.done)), [items, selectedCategory, filter]);
  const remaining = items.filter((item) => !item.done).length;
  const completed = items.length - remaining;
  const progress = items.length ? Math.round(completed / items.length * 100) : 0;

  function toggleItem(id) {
    setItems((current) => {
      const next = current.map((item) => item.id === id ? { ...item, done: !item.done } : item);
      const changed = next.find((item) => item.id === id);
      return changed.done ? [...next.filter((item) => item.id !== id), changed] : [changed, ...next.filter((item) => item.id !== id)];
    });
  }
  function addItem() {
    if (!name.trim()) return;
    setItems((current) => [...current, { id: Date.now().toString(), name: name.trim(), quantity: quantity.trim() || '۱ عدد', category: selectedCategory === 'همه' ? 'سایر' : selectedCategory, done: false }]);
    setName(''); setQuantity(''); setAddOpen(false);
  }
  function addCategory() {
    const value = newCategory.trim();
    if (!value || categories.includes(value)) return;
    setCategories((current) => [...current, value]); setNewCategory('');
  }
  function archiveList() {
    if (!items.length) return;
    setHistory((current) => [{ id: Date.now().toString(), date: new Date().toLocaleDateString('fa-IR'), items }, ...current]);
    setItems([]); setMenuOpen(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5FA" />
      <FlatList
        data={visible} keyExtractor={(item) => item.id} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}
        ListHeaderComponent={<>
          <View style={s.header}>
            <View style={s.headerCopy}><Text style={s.brand}>NziCode</Text><Text style={s.greeting}>سلام محمد علی 👋</Text><Text style={s.subtitle}>خرید امروزت را ساده‌تر مدیریت کن</Text></View>
            <View style={s.headerActions}><Pressable onPress={() => setMenuOpen(true)} style={s.icon}><Text style={s.iconText}>☰</Text></Pressable><Pressable onPress={() => setContactOpen(true)} style={s.avatar}><Text style={s.avatarText}>م</Text></Pressable></View>
          </View>
          <View style={s.summary}><View style={s.summaryTop}><View style={s.percentBubble}><Text style={s.percent}>{progress}٪</Text></View><View style={s.summaryCopy}><Text style={s.summaryTitle}>پیشرفت لیست خرید</Text><Text style={s.summaryCaption}>{remaining ? `${remaining} قلم باقی مانده` : 'لیست کامل شد 🎉'}</Text></View></View><View style={s.track}><View style={[s.fill, { width: `${progress}%` }]} /></View><View style={s.stats}><Text style={s.stat}>{items.length} قلم در لیست</Text><Text style={s.stat}>{completed} خریداری‌شده</Text></View></View>
          <View style={s.sectionRow}><Text style={s.sectionTitle}>لیست من</Text><Text style={s.counter}>{items.length} قلم</Text></View>
          <View style={s.filterRow}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[s.filter, filter === item && s.filterActive]}><Text style={[s.filterText, filter === item && s.filterTextActive]}>{item}</Text></Pressable>)}</View>
          <View style={s.categoryHeader}><Text style={s.categoryLabel}>دسته‌بندی</Text><Pressable onPress={() => setCategoryOpen(true)} style={s.addCategory}><Text style={s.addCategoryText}>＋ افزودن</Text></Pressable></View>
          <FlatList data={categories} horizontal inverted showsHorizontalScrollIndicator={false} keyExtractor={(item) => item} contentContainerStyle={s.chips} renderItem={({ item }) => <Pressable onPress={() => setSelectedCategory(item)} style={[s.chip, selectedCategory === item && s.chipActive]}><Text style={[s.chipText, selectedCategory === item && s.chipTextActive]}>{item}</Text></Pressable>} />
        </>}
        renderItem={({ item }) => <Pressable onPress={() => toggleItem(item.id)} style={s.item}><View style={[s.checkbox, item.done && s.checkboxDone]}>{item.done && <Text style={s.check}>✓</Text>}</View><View style={s.itemCopy}><Text style={[s.itemName, item.done && s.itemNameDone]}>{item.name}</Text><Text style={s.itemMeta}>{item.category} • {item.quantity}</Text></View><View style={[s.dot, item.done && s.dotDone]} /></Pressable>}
        ListEmptyComponent={<Text style={s.empty}>موردی در این فیلتر نیست.</Text>}
        ListFooterComponent={<View style={s.footer}><Text style={s.footerText}>خریدیار، ساده و هوشمند</Text><Pressable onPress={() => setContactOpen(true)}><Text style={s.footerLink}>درباره NziCode</Text></Pressable></View>}
      />
      <Pressable onPress={() => setAddOpen(true)} style={s.fab}><Text style={s.fabPlus}>+</Text><Text style={s.fabText}>افزودن کالا</Text></Pressable>

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setAddOpen(false)} /><View style={s.sheet}><View style={s.handle} /><View style={s.sheetHeader}><Pressable onPress={() => setAddOpen(false)}><Text style={s.close}>×</Text></Pressable><Text style={s.sheetTitle}>افزودن به لیست</Text></View><TextInput value={name} onChangeText={setName} placeholder="نام کالا، مثلاً ماست یونانی" placeholderTextColor="#A4A8B7" style={s.input} autoFocus /><TextInput value={quantity} onChangeText={setQuantity} placeholder="مقدار، مثلاً ۲ عدد" placeholderTextColor="#A4A8B7" style={s.input} /><Pressable onPress={addItem} style={s.save}><Text style={s.saveText}>افزودن به لیست</Text></Pressable></View></View></Modal>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setMenuOpen(false)} /><View style={s.sheet}><View style={s.handle} /><Text style={s.sheetTitle}>منوی خریدیار</Text><Pressable style={s.menuRow} onPress={() => { setMenuOpen(false); setCategoryOpen(true); }}><Text style={s.menuArrow}>‹</Text><Text style={s.menuText}>مدیریت دسته‌بندی‌ها</Text></Pressable><Pressable style={s.menuRow} onPress={() => { setMenuOpen(false); setHistoryOpen(true); }}><Text style={s.menuArrow}>‹</Text><Text style={s.menuText}>لیست‌های خرید قبلی</Text></Pressable><Pressable style={s.menuRow} onPress={archiveList}><Text style={s.menuArrow}>‹</Text><Text style={s.menuText}>آرشیو لیست فعلی</Text></Pressable></View></View></Modal>

      <Modal visible={categoryOpen} transparent animationType="slide" onRequestClose={() => setCategoryOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setCategoryOpen(false)} /><View style={s.sheet}><View style={s.handle} /><View style={s.sheetHeader}><Pressable onPress={() => setCategoryOpen(false)}><Text style={s.close}>×</Text></Pressable><Text style={s.sheetTitle}>مدیریت دسته‌بندی‌ها</Text></View><View style={s.categoryInputRow}><TextInput value={newCategory} onChangeText={setNewCategory} placeholder="نام دسته‌بندی جدید" placeholderTextColor="#A4A8B7" style={[s.input, s.categoryInput]} /><Pressable onPress={addCategory} style={s.smallAdd}><Text style={s.smallAddText}>افزودن</Text></Pressable></View>{categories.slice(1).map((item) => <View key={item} style={s.manageRow}><Text style={s.manageText}>{item}</Text><Text style={s.manageDot}>•</Text></View>)}</View></View></Modal>

      <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}><View style={s.backdrop}><Pressable style={s.dismiss} onPress={() => setHistoryOpen(false)} /><View style={s.sheet}><View style={s.handle} /><View style={s.sheetHeader}><Pressable onPress={() => setHistoryOpen(false)}><Text style={s.close}>×</Text></Pressable><Text style={s.sheetTitle}>لیست‌های خرید قبلی</Text></View>{history.length ? history.map((list) => <View key={list.id} style={s.historyRow}><Text style={s.historyCount}>{list.items.length} قلم</Text><Text style={s.manageText}>لیست خرید {list.date}</Text></View>) : <Text style={s.empty}>هنوز لیستی آرشیو نشده است.</Text>}</View></View></Modal>

      <Modal visible={contactOpen} transparent animationType="fade" onRequestClose={() => setContactOpen(false)}><View style={s.contactBackdrop}><View style={s.contactModal}><Pressable onPress={() => setContactOpen(false)}><Text style={s.close}>×</Text></Pressable><Text style={s.contactBrand}>NziCode</Text><Text style={s.contactName}>محمد علی نظری</Text><Text style={s.contactLine}>واتساپ: 09198433408</Text><Text style={s.contactLine}>ایمیل: nazari.moradkhani@gmail.com</Text><Text style={s.contactLine}>تلگرام: NziCode</Text></View></View></Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5FA' }, container: { padding: 18, paddingBottom: 105 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, headerCopy: { alignItems: 'flex-end' }, headerActions: { flexDirection: 'row', gap: 8 },
  brand: { color: '#6554E8', fontSize: 12, fontWeight: '900', marginBottom: 7 }, greeting: { color: '#171A2A', fontSize: 23, fontWeight: '900' }, subtitle: { color: '#858B9E', fontSize: 12, marginTop: 6 },
  avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#E7E3FF', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#6554E8', fontSize: 20, fontWeight: '900' }, icon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, iconText: { color: '#6554E8', fontSize: 22 },
  summary: { backgroundColor: '#25213F', borderRadius: 24, padding: 18, marginBottom: 25 }, summaryTop: { flexDirection: 'row-reverse', alignItems: 'center' }, summaryCopy: { flex: 1, alignItems: 'flex-end', marginRight: 12 }, summaryTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' }, summaryCaption: { color: '#C2BDF1', fontSize: 12, marginTop: 5 }, percentBubble: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#6E5BEE', alignItems: 'center', justifyContent: 'center' }, percent: { color: '#FFF', fontSize: 16, fontWeight: '900' }, track: { height: 7, backgroundColor: '#464064', borderRadius: 9, overflow: 'hidden', marginTop: 17 }, fill: { height: 7, backgroundColor: '#B7AFFF', borderRadius: 9 }, stats: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12 }, stat: { color: '#AFAAD8', fontSize: 11 },
  sectionRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, sectionTitle: { color: '#1C2030', fontSize: 18, fontWeight: '900' }, counter: { color: '#9298A9', fontSize: 12 }, filterRow: { flexDirection: 'row-reverse', backgroundColor: '#E9EAF1', borderRadius: 13, padding: 3, marginBottom: 12 }, filter: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' }, filterActive: { backgroundColor: '#FFF' }, filterText: { color: '#9298A9', fontSize: 11, fontWeight: '700' }, filterTextActive: { color: '#6554E8' },
  categoryHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }, categoryLabel: { color: '#555B6D', fontSize: 13, fontWeight: '800' }, addCategory: { padding: 6 }, addCategoryText: { color: '#6554E8', fontSize: 12, fontWeight: '800' }, chips: { gap: 8, paddingVertical: 10 }, chip: { backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9 }, chipActive: { backgroundColor: '#E7E3FF' }, chipText: { color: '#777D90', fontSize: 11, fontWeight: '700' }, chipTextActive: { color: '#6554E8' },
  item: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 17, padding: 13, marginBottom: 8 }, itemCopy: { flex: 1, alignItems: 'flex-end', marginRight: 11 }, itemName: { color: '#25283A', fontSize: 14, fontWeight: '800' }, itemNameDone: { textDecorationLine: 'line-through', color: '#A0A4B1' }, itemMeta: { color: '#9A9FAE', fontSize: 10, marginTop: 5 }, checkbox: { width: 25, height: 25, borderRadius: 9, borderWidth: 1.5, borderColor: '#D9DCE6', alignItems: 'center', justifyContent: 'center' }, checkboxDone: { backgroundColor: '#52C99A', borderColor: '#52C99A' }, check: { color: '#FFF', fontWeight: '900' }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF916F' }, dotDone: { backgroundColor: '#52C99A' }, empty: { textAlign: 'center', color: '#9298A9', padding: 25 },
  footer: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 8, paddingTop: 22 }, footerText: { color: '#A0A5B4', fontSize: 10 }, footerLink: { color: '#6554E8', fontSize: 10, fontWeight: '800' }, fab: { position: 'absolute', bottom: 22, right: 18, left: 18, height: 56, borderRadius: 18, backgroundColor: '#6554E8', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' }, fabPlus: { color: '#FFF', fontSize: 25, marginLeft: 9 }, fabText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,19,38,.45)', justifyContent: 'flex-end' }, dismiss: { flex: 1 }, sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28 }, handle: { width: 42, height: 5, borderRadius: 4, backgroundColor: '#D8DAE3', alignSelf: 'center', marginBottom: 14 }, sheetHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 }, sheetTitle: { color: '#1D2030', fontSize: 19, fontWeight: '900' }, close: { color: '#8E94A4', fontSize: 28 }, input: { backgroundColor: '#F5F6FA', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, color: '#25283A', textAlign: 'right', marginBottom: 10, fontSize: 14 }, save: { backgroundColor: '#FF7A59', borderRadius: 14, alignItems: 'center', paddingVertical: 14, marginTop: 8 }, saveText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  menuRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: '#F0F1F5' }, menuText: { color: '#25283A', fontSize: 14, fontWeight: '800' }, menuArrow: { color: '#6554E8', fontSize: 24 }, categoryInputRow: { flexDirection: 'row-reverse', gap: 8 }, categoryInput: { flex: 1 }, smallAdd: { backgroundColor: '#6554E8', borderRadius: 12, paddingHorizontal: 13, justifyContent: 'center', marginBottom: 10 }, smallAddText: { color: '#FFF', fontWeight: '800', fontSize: 12 }, manageRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 12 }, manageText: { color: '#35394A', fontSize: 13 }, manageDot: { color: '#6554E8' }, historyRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F1F5' }, historyCount: { color: '#6554E8', fontWeight: '800', fontSize: 12 },
  contactBackdrop: { flex: 1, backgroundColor: 'rgba(20,19,38,.45)', alignItems: 'center', justifyContent: 'center', padding: 25 }, contactModal: { width: '100%', backgroundColor: '#25213F', borderRadius: 24, padding: 22, alignItems: 'flex-end' }, contactBrand: { color: '#B9B0FF', fontSize: 18, fontWeight: '900', marginTop: 10 }, contactName: { color: '#FFF', fontSize: 15, fontWeight: '800', marginTop: 5, marginBottom: 12 }, contactLine: { color: '#D5D2ED', fontSize: 11, marginTop: 6 },
});
