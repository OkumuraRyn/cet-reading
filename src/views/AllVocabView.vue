<!-- src/views/AllVocabView.vue -->
<template>
  <div class="all-vocab-container">
    <header class="page-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 返回门户</router-link>
        <h1>学习历程词库</h1>
      </div>
      <div class="header-right">
        <span class="total-badge">记录词汇: {{ studyStore.vocabularyList.length }}</span>
      </div>
    </header>

    <main class="vocab-content">
      <div v-if="studyStore.vocabularyList.length === 0" class="empty-state">
        空空如也，快去阅读文章并长按单词添加吧！
      </div>

      <div v-else class="vocab-table">
        <div class="table-header">
          <span>单词</span>
          <span>语境释义解析 (点击展开)</span>
          <span>出现文章</span>
          <span>操作</span>
        </div>
        
        <div v-for="v in studyStore.vocabularyList" :key="v.word" class="table-row">
          <div class="word-col">
            <strong class="word-text">{{ v.word }}</strong>
          </div>
          
          <!-- 核心改动：点击切换展开状态 -->
          <div 
            class="mean-col" 
            :class="{ 'is-expanded': isExpanded(v.word) }"
            @click="toggleExpand(v.word)"
          >
            <span class="detail-text">
              {{ isExpanded(v.word) ? v.detail : truncateText(v.detail) }}
            </span>
            <span v-if="v.detail && v.detail.length > 40" class="expand-btn">
              {{ isExpanded(v.word) ? ' [收起]' : ' [展开]' }}
            </span>
          </div>

          <div class="source-col">
            <div class="source-tags">
              <router-link 
                v-for="sid in (v.sources || [v.articleId])" 
                :key="sid" 
                :to="`/article/${sid}`" 
                class="tag"
              >
                {{ sid }}
              </router-link>
            </div>
          </div>
          <div class="action-col">
            <button class="del-btn" @click="studyStore.removeVocabItem(v.word)">移除</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStudyStore } from '../store/studyStore';
const studyStore = useStudyStore();

// 记录展开状态的单词列表
const expandedWords = ref(new Set());

const isExpanded = (word) => expandedWords.value.has(word);

const toggleExpand = (word) => {
  if (expandedWords.value.has(word)) {
    expandedWords.value.delete(word);
  } else {
    expandedWords.value.add(word);
  }
};

const truncateText = (text) => {
  if (!text) return "";
  return text.length > 40 ? text.substring(0, 40) + "..." : text;
};
</script>

<style scoped>
.all-vocab-container { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.back-link { text-decoration: none; color: #64748b; margin-right: 20px; }
.total-badge { background: #42b983; color: white; padding: 8px 20px; border-radius: 30px; font-weight: 800; font-size: 0.9rem; }

.vocab-table { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.table-header { display: grid; grid-template-columns: 1.2fr 4fr 2fr 0.8fr; background: #f8fafc; padding: 15px 20px; font-weight: bold; color: #475569; }
.table-row { display: grid; grid-template-columns: 1.2fr 4fr 2fr 0.8fr; padding: 18px 20px; border-top: 1px solid #f1f5f9; align-items: start; }

.word-text { font-size: 1.1rem; color: #1e293b; }

/* 释义列样式优化 */
.mean-col { 
  color: #475569; 
  font-size: 0.9rem; 
  line-height: 1.5; 
  padding-right: 20px; 
  cursor: pointer; 
  transition: background 0.2s;
  border-radius: 8px;
}
.mean-col:hover { color: #1e293b; }
.mean-col.is-expanded { 
  white-space: pre-line; /* 保持 AI 输出的换行格式 */
  background: #f8fafc;
  padding: 10px;
}

.expand-btn {
  color: #42b983;
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: 5px;
}

.source-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { background: #eefdf5; color: #42b983; text-decoration: none; font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; border: 1px solid #dcfce7; }
.tag:hover { background: #42b983; color: white; }

.del-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem; padding-top: 5px; }
.del-btn:hover { color: #ef4444; text-decoration: underline; }

@media (max-width: 768px) {
  .table-header { display: none; }
  .table-row { grid-template-columns: 1fr; gap: 10px; }
  .mean-col { padding: 0; }
}
</style>
