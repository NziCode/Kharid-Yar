import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const initialItems = [
  { id: '1', name: 'شیر کم‌چرب', category: 'لبنیات', quantity: '۲ عدد', done: false },
  { id: '2', name: 'نان سنگک', category: 'نان و غلات', quantity: '۱ عدد', done: true },
  { id: '3', name: 'تخم مرغ', category: 'پروتئینی', quantity: '۱ شانه', done: false },
  { id: '4', name: 'گوجه فرنگی', category: 'میوه و سبزی', quantity: '۱ کیلو', done: false },
];

const categories = ['همه', 'لبنیات', 'میوه و سبزی', 'پروتئینی', 'نان و غلات'];
const filters = ['همه', 'باقی‌مانده', 'خریداری‌شده'];

export default function App() {
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('همه');
  const [filter, setFilter] = useState('همه');
  const [addOpen, setAddOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const visibleItems = useMemo(() => items.filter((item) => {
    const categoryMatch = selectedCategory === 'همه' || item.category === selectedCategory;
    const filterMatch = filter === 'همه' || (filter === 'باقی‌مانده' ? !item.done : item.done);
    return categoryMatch && filterMatch;
  }), [items, selectedCategory, filter]);

  const remaining = items.filter((item) => !item.done).length;
  const completed = items.length - remaining;
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;

  function addItem() {
    if (!name.trim()) return;
    setItems((current) => [...current, {
      id: Date.now().toString(),
      name: name.trim(),
      quantity: quantity.trim() || '۱ عدد',
      category: selectedCategory === 'همه' ? 'سایر' : selectedCategory,
      done: false,
    }]);
    setName('');
    setQuantity('');
    setAddOpen(false);
  }

  function toggleItem(id) {
    setItems((current) => current.map((item) => (
      item.id === id ? { ...item, done: !item.done } : item
    )));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5FA" />
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.brand}>NziCode</Text>
                <Text style={styles.greeting}>سلام محمد علی 👋</Text>
                <Text style={styles.subtitle}>خرید امروزت را ساده‌تر مدیریت کن</Text>
              </View>
              <Pressable onPress={() => setContactOpen(true)} style={styles.profileButton}>
                <Text style={styles.profileLetter}>م</Text>
              </Pressable>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View style={styles.percentBubble}><Text style={styles.percent}>{progress}٪</Text></View>
                <View style={styles.summaryCopy}>
                  <Text style={styles.summaryTitle}>پیشرفت لیست خرید</Text>
                  <Text style={styles.summaryCaption}>
                    {remaining ? `${remaining} قلم باقی مانده` : 'لیست کامل شد 🎉'}
                  </Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <View style={styles.stats}>
                <Text style={styles.statText}>{items.length} قلم در لیست</Text>
                <Text style={styles.statText}>{completed} خریداری‌شده</Text>
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>لیست من</Text>
              <Text style={styles.counter}>{items.length} قلم</Text>
            </View>

            <View style={styles.filterRow}>
              {filters.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[styles.filter, filter === item && styles.filterActive]}
                >
                  <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <FlatList
              data={categories}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => (
                <Pressable onPress={() => setSelectedCategory(item)} style={[styles.chip, selectedCategory === item && styles.chipActive]}>
                  <Text style={[styles.chipText, selectedCategory === item && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              )}
            />
          </>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleItem(item.id)} style={styles.item}>
            <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
              {item.done && <Text style={styles.check}>✓</Text>}
            </View>
            <View style={styles.itemCopy}>
              <Text style={[styles.itemName, item.done && styles.itemNameDone]}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.category}  •  {item.quantity}</Text>
            </View>
            <View style={[styles.itemDot, item.done && styles.itemDotDone]} />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>موردی در این فیلتر نیست.</Text>}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>خریدیار، ساده و هوشمند</Text>
            <Pressable onPress={() => setContactOpen(true)}><Text style={styles.footerLink}>درباره NziCode</Text></Pressable>
          </View>
        }
      />

      <Pressable onPress={() => setAddOpen(true)} style={styles.fab}>
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabText}>افزودن کالا</Text>
      </Pressable>

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setAddOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setAddOpen(false)}><Text style={styles.close}>×</Text></Pressable>
              <Text style={styles.sheetTitle}>افزودن به لیست</Text>
            </View>
            <TextInput value={name} onChangeText={setName} placeholder="نام کالا، مثلاً ماست یونانی" placeholderTextColor="#A4A8B7" style={styles.modalInput} autoFocus />
            <TextInput value={quantity} onChangeText={setQuantity} placeholder="مقدار، مثلاً ۲ عدد" placeholderTextColor="#A4A8B7" style={styles.modalInput} />
            <Text style={styles.modalLabel}>دسته‌بندی</Text>
            <View style={styles.modalCategories}>
              {categories.slice(1).map((item) => (
                <Pressable key={item} onPress={() => setSelectedCategory(item)} style={[styles.modalChip, selectedCategory === item && styles.chipActive]}>
                  <Text style={[styles.chipText, selectedCategory === item && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={addItem} style={styles.saveButton}><Text style={styles.saveButtonText}>افزودن به لیست</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={contactOpen} transparent animationType="fade" onRequestClose={() => setContactOpen(false)}>
        <View style={styles.contactBackdrop}>
          <View style={styles.contactModal}>
            <Pressable onPress={() => setContactOpen(false)}><Text style={styles.close}>×</Text></Pressable>
            <Text style={styles.contactBrand}>NziCode</Text>
            <Text style={styles.contactName}>محمد علی نظری</Text>
            <Text style={styles.contactLine}>واتساپ: 09198433408</Text>
            <Text style={styles.contactLine}>ایمیل: nazari.moradkhani@gmail.com</Text>
            <Text style={styles.contactLine}>تلگرام: NziCode</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5FA' },
  container: { padding: 18, paddingBottom: 110 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  headerCopy: { alignItems: 'flex-end' },
  brand: { color: '#6554E8', fontSize: 12, fontWeight: '900', marginBottom: 7 },
  greeting: { color: '#171A2A', fontSize: 23, fontWeight: '900' },
  subtitle: { color: '#858B9E', fontSize: 12, marginTop: 6 },
  profileButton: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#E7E3FF', alignItems: 'center', justifyContent: 'center' },
  profileLetter: { color: '#6554E8', fontSize: 20, fontWeight: '900' },
  summaryCard: { backgroundColor: '#25213F', borderRadius: 24, padding: 18, marginBottom: 25 },
  summaryTop: { flexDirection: 'row-reverse', alignItems: 'center' },
  summaryCopy: { flex: 1, alignItems: 'flex-end', marginRight: 12 },
  summaryTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  summaryCaption: { color: '#C2BDF1', fontSize: 12, marginTop: 5 },
  percentBubble: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#6E5BEE', alignItems: 'center', justifyContent: 'center' },
  percent: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  progressTrack: { height: 7, backgroundColor: '#464064', borderRadius: 9, overflow: 'hidden', marginTop: 17 },
  progressFill: { height: 7, backgroundColor: '#B7AFFF', borderRadius: 9 },
  stats: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12 },
  statText: { color: '#AFAAD8', fontSize: 11 },
  sectionRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#1C2030', fontSize: 18, fontWeight: '900' },
  counter: { color: '#9298A9', fontSize: 12 },
  filterRow: { flexDirection: 'row-reverse', backgroundColor: '#E9EAF1', borderRadius: 13, padding: 3, marginBottom: 13 },
  filter: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  filterActive: { backgroundColor: '#FFF' },
  filterText: { color: '#9298A9', fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: '#6554E8' },
  chips: { gap: 8, paddingBottom: 16 },
  chip: { backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9 },
  chipActive: { backgroundColor: '#E7E3FF' },
  chipText: { color: '#777D90', fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: '#6554E8' },
  item: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 17, padding: 13, marginBottom: 8 },
  itemCopy: { flex: 1, alignItems: 'flex-end', marginRight: 11 },
  itemName: { color: '#25283A', fontSize: 14, fontWeight: '800' },
  itemNameDone: { textDecorationLine: 'line-through', color: '#A0A4B1' },
  itemMeta: { color: '#9A9FAE', fontSize: 10, marginTop: 5 },
  checkbox: { width: 25, height: 25, borderRadius: 9, borderWidth: 1.5, borderColor: '#D9DCE6', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#52C99A', borderColor: '#52C99A' },
  check: { color: '#FFF', fontWeight: '900' },
  itemDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF916F' },
  itemDotDone: { backgroundColor: '#52C99A' },
  empty: { textAlign: 'center', color: '#9298A9', padding: 25 },
  footer: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 22 },
  footerText: { color: '#A0A5B4', fontSize: 10 },
  footerLink: { color: '#6554E8', fontSize: 10, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 22, right: 18, left: 18, height: 56, borderRadius: 18, backgroundColor: '#6554E8', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', shadowColor: '#3E2CB2', shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  fabPlus: { color: '#FFF', fontSize: 25, lineHeight: 27, marginLeft: 9 },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 19, 38, 0.45)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28 },
  sheetHandle: { width: 42, height: 5, borderRadius: 4, backgroundColor: '#D8DAE3', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 },
  sheetTitle: { color: '#1D2030', fontSize: 19, fontWeight: '900' },
  close: { color: '#8E94A4', fontSize: 28, lineHeight: 28 },
  modalInput: { backgroundColor: '#F5F6FA', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, color: '#25283A', textAlign: 'right', marginBottom: 10, fontSize: 14 },
  modalLabel: { color: '#555B6D', textAlign: 'right', fontSize: 12, fontWeight: '800', marginTop: 5, marginBottom: 9 },
  modalCategories: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  modalChip: { backgroundColor: '#F5F6FA', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 },
  saveButton: { backgroundColor: '#FF7A59', borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
  saveButtonText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  contactBackdrop: { flex: 1, backgroundColor: 'rgba(20, 19, 38, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 25 },
  contactModal: { width: '100%', backgroundColor: '#25213F', borderRadius: 24, padding: 22, alignItems: 'flex-end' },
  contactBrand: { color: '#B9B0FF', fontSize: 18, fontWeight: '900', marginTop: 10 },
  contactName: { color: '#FFF', fontSize: 15, fontWeight: '800', marginTop: 5, marginBottom: 12 },
  contactLine: { color: '#D5D2ED', fontSize: 11, marginTop: 6 },
});
