/* src/store/studyStore.js */
import { reactive, watch } from 'vue';

const savedVocab = localStorage.getItem('cet_study_vocab');
const initialVocab = savedVocab ? JSON.parse(savedVocab) : [];

export const studyStore = reactive({
  vocabularyList: initialVocab,
  currentDictEntry: null, 
  isAiLoading: false,     
  jumpTarget: null,

  /**
   * 优化后的添加逻辑：全局唯一单词，多来源存储
   */
  addToVocab(entry, articleId) {
    const existingIndex = this.vocabularyList.findIndex(
      v => v.word.toLowerCase() === entry.word.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // 如果单词已存在，仅检查是否需要添加新来源
      const record = this.vocabularyList[existingIndex];
      if (!record.sources) record.sources = [record.articleId]; // 兼容旧数据
      if (!record.sources.includes(articleId)) {
        record.sources.push(articleId);
        record.lastSeen = Date.now(); // 更新最近见到时间
      }
    } else {
      // 新单词存入
      this.vocabularyList.unshift({
        ...entry,
        articleId: articleId, // 首发文章 ID
        sources: [articleId], // 来源列表
        timestamp: Date.now(),
        lastSeen: Date.now(),
        wrongCount: 0 
      });
    }
  },

  performJump(word, section, articleId = null) {
    this.jumpTarget = { word, section, articleId, t: Date.now() };
  },

  clearAll() {
    if(confirm('确定要清空所有单词本记录吗？')) {
        this.vocabularyList = [];
    }
  },

  removeVocabItem(word) {
    const index = this.vocabularyList.findIndex(v => v.word.toLowerCase() === word.toLowerCase());
    if (index !== -1) {
      this.vocabularyList.splice(index, 1);
    }
  }
});

watch(
  () => studyStore.vocabularyList,
  (newList) => {
    localStorage.setItem('cet_study_vocab', JSON.stringify(newList));
  },
  { deep: true }
);