import { ref, watch } from 'vue';

const vocabList = ref(JSON.parse(localStorage.getItem('my_reading_vocab') || '[]'));

watch(vocabList, (newVal) => {
  localStorage.setItem('my_reading_vocab', JSON.stringify(newVal));
}, { deep: true });

export function useVocab() {
  const addWord = (word) => {
    const w = word.trim().toLowerCase();
    if (w && !vocabList.value.some(v => v.word.toLowerCase() === w)) {
      vocabList.value.unshift({ word, timestamp: Date.now() });
    }
  };
  const removeWord = (index) => vocabList.value.splice(index, 1);
  return { vocabList, addWord, removeWord };
}