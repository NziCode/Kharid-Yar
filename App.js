import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, FlatList, StyleSheet, StatusBar } from 'react-native';

const initialItems = [
  { id: '1', name: 'شیر کم‌چرب', category: 'لبنیات', quantity: '۲ عدد', done: false },
  { id: '2', name: 'نان سنگک', category: 'نان و غلات', quantity: '۱ عدد', done: true },
  { id: '3', name: 'تخم مرغ', category: 'پروتئینی', quantity: '۱ شانه', done: false },
  { id: '4', name: 'گوجه فرنگی', category: 'میوه و سبزی', quantity: '۱ کیلو', done: false }
];

const categories = ['همه', 'لبنیات', 'میوه و سبزی', 'پروتئینی', 'نان و غلات'];

export default function App() {
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('همه');
  const [filter, setFilter] = useState('همه');

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesCategory = category === 'همه' || item.category === category;
    const matchesFilter = filter === 'همه' || (filter === 'باقی‌مانده' ? !item.done : item.done);
    return matchesCategory && matchesFilter;
  }), [items, category, filter]);

  const remaining = items.filter((item) => !item.done).length;
  const progress = items.length ? Math.round(((items.length - remaining) / items.length) * 100) : 0;

  function addItem() {
    if (!name.trim()) return;
    setItems((current) => [...current, {
      id: Date.now().toString(),
      name: name.trim(),
      quantity: quantity.trim() || '۱ عدد',
      category: category === 'همه' ? 'سایر' : category,
      done: false
    }]);
    setName('');
    setQuantity('');
  }

  function toggleItem(id) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FC" />
      <FlatList
        contentContainerStyle={styles.container}
        data={visibleItems}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.brand}>NziCode</Text>
                <Text style={styles.eyebrow}>لیست خرید امروز</Text>
                <Text style={styles.title}>سلام! آماده‌ای؟ 👋</Text>
              </View>
              <View style={styles.avatar}><Text style={styles.avatarText}>م</Text></View>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressTitle}>پیشرفت خرید</Text>
                <Text style={styles.progressPercent}>{progress}٪</Text>
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
              <Text style={styles.progressCaption}>{remaining ? `${remaining} قلم تا پایان لیست باقی مانده` : 'همه‌چیز خریداری شد 🎉'}</Text>
            </View>

            <Text style={styles.sectionTitle}>افزودن به لیست</Text>
            <View style={styles.addCard}>
              <TextInput value={name} onChangeText={setName} placeholder="مثلاً: ماست یونانی" placeholderTextColor="#A1A6B5" style={styles.input} />
              <View style={styles.addBottom}>
                <TextInput value={quantity} onChangeText={setQuantity} placeholder="مقدار" placeholderTextColor="#A1A6B5" style={[styles.input, styles.quantity]} />
                <Pressable onPress={addItem} style={styles.addButton}><Text style={styles.addButtonText}>+ افزودن</Text></Pressable>
              </View>
            </View>

            <Text style={styles.sectionTitle}>دسته‌بندی</Text>
            <FlatList data={categories} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item} contentContainerStyle={styles.chips} renderItem={({ item }) => (
              <Pressable onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>
            )} />

            <View style={styles.listHeader}><Text style={styles.sectionTitle}>اقلام لیست</Text><Text style={styles.counter}>{items.length} قلم</Text></View>
            <View style={styles.filterRow}>
              {['همه', 'باقی‌مانده', 'خریداری‌شده'].map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleItem(item.id)} style={[styles.item, item.done && styles.itemDone]}>
            <View style={[styles.checkbox, item.done && styles.checkboxDone]}>{item.done && <Text style={styles.check}>✓</Text>}</View>
            <View style={styles.itemInfo}><Text style={[styles.itemName, item.done && styles.itemNameDone]}>{item.name}</Text><Text style={styles.itemMeta}>{item.category}  •  {item.quantity}</Text></View>
            <Text style={styles.more}>•••</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>موردی در این فیلتر نیست.</Text>}
        ListFooterComponent={<>
          <View style={styles.premium}><Text style={styles.premiumIcon}>✨</Text><View style={styles.premiumCopy}><Text style={styles.premiumTitle}>خرید هوشمندتر با خریدیار پلاس</Text><Text style={styles.premiumText}>مقایسه قیمت و پیشنهادهای اختصاصی فروشگاه‌ها</Text></View><Text style={styles.arrow}>‹</Text></View>
          <View style={styles.contactCard}>
            <Text style={styles.contactBrand}>NziCode</Text>
            <Text style={styles.contactName}>محمد علی نظری</Text>
            <Text style={styles.contactLine}>واتساپ: 09198433408</Text>
            <Text style={styles.contactLine}>ایمیل: nazari.moradkhani@gmail.com</Text>
            <Text style={styles.contactLine}>تلگرام: NziCode</Text>
          </View>
        </>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FC' },
  container: { padding: 20, paddingBottom: 40 },
  topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  eyebrow: { color: '#7C8294', fontSize: 13, textAlign: 'right', marginBottom: 5 },
  title: { color: '#1E2230', fontSize: 24, fontWeight: '800', textAlign: 'right' },
  brand: { color: '#6246EA', fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 5 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E5DEFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#6246EA', fontSize: 20, fontWeight: '700' },
  progressCard: { backgroundColor: '#6246EA', borderRadius: 20, padding: 18, marginBottom: 24 },
  progressTextRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  progressPercent: { color: '#FFF', fontWeight: '800', fontSize: 22 },
  progressTrack: { height: 8, backgroundColor: '#8D79F0', borderRadius: 8, marginVertical: 14, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#FFF', borderRadius: 8 },
  progressCaption: { color: '#E8E4FF', textAlign: 'right', fontSize: 12 },
  sectionTitle: { color: '#202535', fontSize: 17, fontWeight: '800', textAlign: 'right', marginBottom: 10 },
  addCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 22, shadowColor: '#202535', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ECEEF4', paddingVertical: 10, color: '#202535', fontSize: 15, textAlign: 'right' },
  addBottom: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  quantity: { flex: 1 },
  addButton: { backgroundColor: '#FF7A59', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 10 },
  addButtonText: { color: '#FFF', fontWeight: '800' },
  chips: { flexDirection: 'row-reverse', gap: 8, paddingBottom: 22 },
  chip: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9 },
  chipActive: { backgroundColor: '#EAE6FF' },
  chipText: { color: '#71778A', fontSize: 12 },
  chipTextActive: { color: '#6246EA', fontWeight: '700' },
  listHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  counter: { color: '#969BAB', fontSize: 12 },
  filterRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  filter: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10 },
  filterActive: { backgroundColor: '#FFF' },
  filterText: { color: '#969BAB', fontSize: 12 },
  filterTextActive: { color: '#6246EA', fontWeight: '700' },
  item: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 9 },
  itemDone: { opacity: 0.65 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: '#D7DAE4', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  checkboxDone: { backgroundColor: '#53C68C', borderColor: '#53C68C' },
  check: { color: '#FFF', fontWeight: '900' },
  itemInfo: { flex: 1, alignItems: 'flex-end' },
  itemName: { color: '#252A3A', fontSize: 15, fontWeight: '700' },
  itemNameDone: { textDecorationLine: 'line-through', color: '#9297A5' },
  itemMeta: { color: '#989DAB', fontSize: 11, marginTop: 4 },
  more: { color: '#B2B6C2', fontSize: 15, letterSpacing: 1 },
  empty: { textAlign: 'center', color: '#969BAB', padding: 24 },
  premium: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF4E8', borderRadius: 16, padding: 14, marginTop: 16 },
  premiumIcon: { fontSize: 23, marginLeft: 10 },
  premiumCopy: { flex: 1, alignItems: 'flex-end' },
  premiumTitle: { color: '#8D4B20', fontSize: 13, fontWeight: '800' },
  premiumText: { color: '#AF7650', fontSize: 10, marginTop: 4, textAlign: 'right' },
  arrow: { color: '#C77D4A', fontSize: 26 }
  ,contactCard: { backgroundColor: '#202535', borderRadius: 16, padding: 16, marginTop: 12, alignItems: 'flex-end' },
  contactBrand: { color: '#AFA4FF', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  contactName: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  contactLine: { color: '#D4D7E2', fontSize: 11, marginTop: 4 }
});
