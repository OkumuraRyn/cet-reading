<!-- src/views/ArticleView.vue -->
<template>
  <div v-if="article" class="main-reader">
    <!-- 全文朗读按钮（固定右下角） -->
    <button class="full-read-btn" @click="toggleFullReading">
      {{ readingState === 'playing' ? '⏸️ 暂停' : readingState === 'paused' ? '▶️ 继续朗读' : '🔊 全文朗读' }}
    </button>

    <!-- 1. 左侧：文章滚动区域 -->
    <main class="article-section" ref="articleRef">
      <div class="article-content-wrapper">
        <nav class="breadcrumb">
          <router-link to="/">← 目录</router-link> / {{ article.type }}
        </nav>
        
        <header class="art-header">
          <h1>{{ article.title }}</h1>
          <p class="art-title-cn">{{ article.titleCn }}</p>
          <div class="interaction-hint">
            💡 手机端：<strong>长按单词查词</strong> | 单击句子分析/朗读 | 单词右键直接读
          </div>
          <div v-if="selectedSentence" class="selection-tip">
            已选中句子，可在下方 AI 面板提问
            <button @click="clearSelection">取消选中</button>
          </div>
        </header>

        <section class="reading-body">
          <div v-for="(para, pIdx) in article.paragraphs" :key="pIdx" class="para-block para-with-speaker">
            <span class="para-speaker-btn" @click.stop="speakParagraph(para)" title="朗读全段">🔊</span>
            <span
              v-for="(sent, sIdx) in para.sentences"
              :key="sIdx"
              class="sent-item"
              :class="{
                'is-focused': selectedSentence === sent.en,
                'is-playing': readingState !== 'idle' && currentPlayingParaIdx === pIdx && currentPlayingSentIdx === sIdx
              }"
              :data-pidx="pIdx"
              :data-sidx="sIdx"
              @click="handleSentenceClick(sent)"
            >
              <span v-for="(token, tIdx) in tokenize(sent.en)" :key="tIdx" class="token-wrapper">
                <span
                  v-if="token.isWord"
                  :id="`art-word-${token.text.toLowerCase()}`"
                  class="word-token"
                  :class="{
                    'is-added-green': isWordInCurrentVocab(token.text),
                    'is-review-yellow': isWordInOtherVocab(token.text)
                  }"
                  @dblclick.stop="handleWordJumpToVocab(token.text)"
                  @contextmenu.stop.prevent="handleWordRightClickSearch(token.text, sent.en), speak(token.text)"
                  @touchstart="handleTouchStart($event, token.text, sent.en)"
                  @touchend="handleTouchEnd"
                  @touchmove="handleTouchMove"
                >
                  {{ token.text }}
                </span>
                <span v-else>{{ token.text }}</span>
              </span>
            </span>
          </div>
        </section>

        <!-- 默写练习区 -->
        <section class="dictation-area">
          <div class="box-header">
            <div class="header-main">
              <h3>Vocabulary Dictation</h3>
              <span class="badge">{{ currentArticleVocab.length }} 词</span>
            </div>
            <router-link to="/all-vocabulary" class="view-all-btn">查看全量词本 →</router-link>
          </div>
          <div class="vocab-grid">
            <div v-for="(v, idx) in currentArticleVocab" :key="v.timestamp" :id="`vocab-card-${v.word.toLowerCase()}`" class="v-card-container">
              <div class="v-card">
                <div class="v-index">#{{ idx + 1 }}</div>
                <div class="v-info">
                  <strong class="v-playable" @click="speak(v.word)">{{ v.word }} 🔊</strong>
                  <span class="jump-link" @click="studyStore.performJump(v.word, 'article')">[原文]</span>
                </div>
                <input type="text" placeholder="输入拼写" @keyup.enter="handleSpellCheck($event, v.word)" />
                <button class="v-del" @click="studyStore.removeVocabItem(v.word || v.timestamp)">×</button>
              </div>
              <div v-if="v.detail" class="v-item-detail" @click="toggleExpand(v.word)" :class="{ 'is-expanded': isExpanded(v.word) }">
                <span class="detail-text">
                  {{ isExpanded(v.word) ? v.detail : truncateText(v.detail) }}
                </span>
                <span class="expand-label">{{ isExpanded(v.word) ? ' [收起]' : ' [展开]' }}</span>
              </div>
            </div>
          </div>
          <div v-if="currentArticleVocab.length === 0" class="empty-tip">
            本篇文章暂无存入单词
          </div>
        </section>
      </div>
    </main>

    <!-- 2. 右侧/底部：AI 智能面板 -->
    <aside class="ai-panel" :class="{ 'is-expanded': isAiExpanded }">
      <div class="mobile-drag-handle" @click="isAiExpanded = !isAiExpanded">
        <span class="handle-icon">{{ isAiExpanded ? '▼ 收起分析' : '▲ 展开 AI 分析' }}</span>
      </div>
      <div class="ai-card">
        <div class="ai-header">
          AI 助手分析
        </div>
        <div class="ai-scroll-content">
          <div v-if="selectedSentence" class="context-preview">
            <small>当前分析句子：</small>
            <p>{{ selectedSentence }}</p>
            <p class="translation-preview">{{ selectedSentenceCn }}</p>
          </div>
          <div v-if="studyStore.isAiLoading" class="loading-state">
            深度分析中...
          </div>
          <div v-else-if="studyStore.currentDictEntry">
            <div style="font-weight: 900; font-size: 1.2rem; color: #1e293b; margin-bottom: 10px;">
              {{ studyStore.currentDictEntry.word || '分析结果' }}
            </div>
            <div class="ai-res-detail">{{ studyStore.currentDictEntry.detail }}</div>
            <button v-if="studyStore.currentDictEntry.word" class="save-word-btn" @click="confirmAddToVocab">
              + 存入本篇默写本
            </button>
          </div>
          <div v-else style="color:#94a3b8; text-align:center; margin-top:50px;">
            长按单词深度解析<br>单击选中句子进行提问
          </div>
        </div>
        <div class="ai-input-group">
          <input
            type="text"
            v-model="userQuestion"
            :placeholder="selectedSentence ? '问问这句的语法...' : '提问...'"
            @keyup.enter="handleQuestionSubmit"
          />
          <button @click="handleQuestionSubmit">发送</button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { askDeepSeek, askAiQuestion, getCachedResult } from '../services/aiService';
import { useStudyStore } from '../store/studyStore';
const studyStore = useStudyStore();
import { allArticles } from '../data/index';

const route = useRoute();
const article = ref(null);
const articleRef = ref(null);
const userQuestion = ref('');
const selectedSentence = ref('');
const selectedSentenceCn = ref('');
const isAiExpanded = ref(false);

// 全文朗读状态：'idle' | 'playing' | 'paused'
const readingState = ref('idle');
const currentPlayingParaIdx = ref(-1);
const currentPlayingSentIdx = ref(-1);
let sentenceQueue = [];
let currentQueueIndex = 0;

// 切换播放/暂停/继续
const toggleFullReading = () => {
  if (readingState.value === 'idle') {
    startFullReading();
  } else if (readingState.value === 'playing') {
    pauseFullReading();
  } else if (readingState.value === 'paused') {
    resumeFullReading();
  }
};

const startFullReading = () => {
  sentenceQueue = [];
  article.value.paragraphs.forEach((para, pIdx) => {
    para.sentences.forEach((sent, sIdx) => {
      sentenceQueue.push({ text: sent.en, pIdx, sIdx });
    });
  });
  currentQueueIndex = 0;
  readingState.value = 'playing';
  playNextSentence();
};

const pauseFullReading = () => {
  window.speechSynthesis.cancel();
  readingState.value = 'paused';
  // 高亮保留，不清除 currentPlaying 索引
};

const resumeFullReading = () => {
  readingState.value = 'playing';
  playNextSentence();
};

const stopFullReading = () => {
  window.speechSynthesis.cancel();
  readingState.value = 'idle';
  currentPlayingParaIdx.value = -1;
  currentPlayingSentIdx.value = -1;
};

const playNextSentence = () => {
  if (readingState.value !== 'playing') return;
  if (currentQueueIndex >= sentenceQueue.length) {
    stopFullReading();
    return;
  }
  const { text, pIdx, sIdx } = sentenceQueue[currentQueueIndex];
  currentPlayingParaIdx.value = pIdx;
  currentPlayingSentIdx.value = sIdx;
  const sentEl = document.querySelector(`.sent-item[data-pidx="${pIdx}"][data-sidx="${sIdx}"]`);
  sentEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.onend = () => {
    currentQueueIndex++;
    playNextSentence();
  };
  utterance.onerror = () => {
    currentQueueIndex++;
    playNextSentence();
  };
  window.speechSynthesis.speak(utterance);
};

// 路由变化或组件卸载时停止
watch(() => route.params.id, () => {
  if (readingState.value !== 'idle') stopFullReading();
});
onUnmounted(() => {
  if (readingState.value !== 'idle') stopFullReading();
});

// 原有逻辑保持不变...

const expandedWords = ref(new Set());
const isExpanded = (word) => expandedWords.value.has(word);
const toggleExpand = (word) => {
  if (expandedWords.value.has(word)) {
    expandedWords.value.delete(word);
  } else {
    expandedWords.value.add(word);
  }
};
const truncateText = (text) => text && text.length > 35 ? text.substring(0, 35) + "..." : text;

const speak = (content) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(content);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

const speakParagraph = (para) => {
  if (!window.speechSynthesis) return;
  const paragraphText = para.sentences.map(s => s.en).join(' ');
  speak(paragraphText);
};

const currentArticleVocab = computed(() => {
  return studyStore.vocabularyList.filter(v => {
    const isPrimary = v.articleId === route.params.id;
    const isInSources = v.sources && v.sources.includes(route.params.id);
    return isPrimary || isInSources;
  });
});

const isWordInCurrentVocab = (word) => {
  return currentArticleVocab.value.some(v => v.word.toLowerCase() === word.toLowerCase());
};

const isWordInOtherVocab = (word) => {
  const w = word.toLowerCase();
  return !isWordInCurrentVocab(word) && studyStore.vocabularyList.some(v => v.word.toLowerCase() === w);
};

let touchTimer = null;
let isLongPress = false;

const handleTouchStart = (e, word, sentEn) => {
  isLongPress = false;
  touchTimer = setTimeout(() => {
    isLongPress = true;
    triggerAiQuery(word, sentEn);
    if (navigator.vibrate) navigator.vibrate(50);
  }, 600);
};

const handleTouchEnd = () => clearTimeout(touchTimer);
const handleTouchMove = () => clearTimeout(touchTimer);

onMounted(() => {
  article.value = allArticles.find(a => a.id === route.params.id);
});

const tokenize = (text) => text.split(/(\b\w+\b)/g).map(t => ({ text: t, isWord: /^\w+$/.test(t) }));

const handleWordRightClickSearch = (word, sentEn) => {
  triggerAiQuery(word, sentEn);
};

const handleWordJumpToVocab = (word) => {
  studyStore.performJump(word, 'vocabulary');
};

const handleSentenceClick = (sent) => {
  if (isLongPress) {
    isLongPress = false;
    return;
  }
  selectedSentence.value = sent.en;
  selectedSentenceCn.value = sent.cn;
  if (window.innerWidth <= 768) isAiExpanded.value = true;
  speak(sent.en);
};

const clearSelection = () => {
  selectedSentence.value = '';
  selectedSentenceCn.value = '';
};

const triggerAiQuery = async (word, sentenceEn) => {
  isAiExpanded.value = true;
  const cached = getCachedResult('dict', word, sentenceEn);
  if (cached) {
    studyStore.currentDictEntry = { word, detail: cached };
    return;
  }
  studyStore.isAiLoading = true;
  studyStore.currentDictEntry = null;
  try {
    const res = await askDeepSeek(word, sentenceEn);
    studyStore.currentDictEntry = { word, detail: res };
  } finally {
    studyStore.isAiLoading = false;
  }
};

const handleQuestionSubmit = async () => {
  if (!userQuestion.value) return;
  isAiExpanded.value = true;
  const cached = getCachedResult('quest', userQuestion.value, selectedSentence.value);
  if (cached) {
    studyStore.currentDictEntry = { word: "", detail: cached };
    userQuestion.value = "";
    return;
  }
  studyStore.isAiLoading = true;
  studyStore.currentDictEntry = null;
  try {
    const res = await askAiQuestion(userQuestion.value, selectedSentence.value);
    studyStore.currentDictEntry = { word: "", detail: res };
  } finally {
    studyStore.isAiLoading = false;
    userQuestion.value = "";
  }
};

const confirmAddToVocab = () => {
  if (studyStore.currentDictEntry?.word) {
    studyStore.addToVocab(studyStore.currentDictEntry, article.value.id);
  }
};

const handleSpellCheck = (e, target) => {
  const value = e.target.value.trim().toLowerCase();
  const isOk = value === target.toLowerCase();
  e.target.style.borderColor = isOk ? '#42b983' : '#ef4444';
  e.target.style.backgroundColor = isOk ? '#f0fdf4' : '#fef2f2';
};

watch(() => studyStore.jumpTarget, (target) => {
  if (!target) return;
  nextTick(() => {
    let element = (target.section === 'article')
      ? articleRef.value?.querySelector(`#art-word-${target.word.toLowerCase()}`)
      : document.getElementById(`vocab-card-${target.word.toLowerCase()}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('jump-highlight');
      setTimeout(() => element.classList.remove('jump-highlight'), 1500);
    }
  });
});
</script>

<style scoped>
/* 样式保持原有 + 全文朗读按钮 */
.main-reader { display: flex; height: 100vh; background: #fff; overflow: hidden; }
.article-section { flex: 1; overflow-y: auto; padding: 40px 20px; }
.article-content-wrapper { max-width: 800px; margin: 0 auto; }
.art-header h1 { font-size: 2.2rem; margin-bottom: 8px; color: #1e293b; }
.art-title-cn { font-size: 1.1rem; color: #42b983; font-weight: 500; margin-bottom: 10px; }
.interaction-hint { font-size: 0.8rem; color: #94a3b8; margin-bottom: 20px; line-height: 1.5; }
.selection-tip { background: #eefdf5; padding: 10px 15px; border-radius: 8px; font-size: 0.9rem; color: #34a871; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.selection-tip button { background: #fff; border: 1px solid #42b983; color: #42b983; padding: 2px 10px; border-radius: 4px; cursor: pointer; }
.para-with-speaker { position: relative; padding-left: 35px; }
.para-speaker-btn { position: absolute; left: 0; top: 5px; cursor: pointer; font-size: 1.1rem; opacity: 0.3; transition: opacity 0.2s; user-select: none; }
.para-speaker-btn:hover { opacity: 1; transform: scale(1.2); }
.para-block { margin-bottom: 25px; line-height: 2; font-size: 1.15rem; color: #334155; }
.sent-item { transition: all 0.2s; border-radius: 4px; padding: 0 4px; cursor: pointer; border-bottom: 2px solid transparent; -webkit-tap-highlight-color: transparent; }
.sent-item:hover { background: #f8fafc; }
.is-focused { background: #f0fdf4; border-bottom: 2px solid #42b983; }
.is-playing { background: #f0fdf4; border-bottom: 2px solid #42b983; }
.token-wrapper { display: contents; }
.word-token { cursor: pointer; transition: all 0.2s; border-radius: 3px; user-select: none; -webkit-user-select: none; }
.word-token:hover { background: #f1f5f9; color: #42b983; }
.is-added-green { color: #42b983 !important; font-weight: bold; }
.jump-highlight { background: #8cdc5e8e !important; border-radius: 4px; }
.is-review-yellow { color: #eab308 !important; font-weight: bold; border-bottom: 2px dashed #eab308; }
.ai-panel { width: 380px; background: #f8fafc; border-left: 1px solid #e2e8f0; padding: 20px; }
.ai-card { height: 100%; display: flex; flex-direction: column; background: #fff; border: 1.5px solid #42b983; border-radius: 16px; padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.ai-header { font-weight: 800; color: #42b983; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 10px; }
.ai-scroll-content { flex: 1; overflow-y: auto; font-size: 0.95rem; line-height: 1.6; color: #475569; }
.context-preview { background: #f1f5f9; padding: 10px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #cbd5e1; }
.translation-preview { color: #42b983; margin-top: 8px !important; font-weight: 500; font-style: normal !important; border-top: 1px dashed #cbd5e1; padding-top: 5px; }
.ai-res-detail { white-space: pre-line; margin-bottom: 20px; }
.ai-input-group { display: flex; gap: 8px; margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; }
.ai-input-group input { flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; }
.ai-input-group button { background: #42b983; color: white; border: none; padding: 0 15px; border-radius: 8px; cursor: pointer; }
.save-word-btn { width: 100%; background: #42b983; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.dictation-area { margin-top: 60px; padding-top: 40px; border-top: 2px solid #f1f5f9; padding-bottom: 100px; }
.box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.view-all-btn { font-size: 0.8rem; color: #42b983; text-decoration: none; font-weight: bold; }
.badge { background: #eefdf5; color: #42b983; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }
.v-card-container { background: #fff; border: 1px solid #eee; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
.v-card { display: flex; align-items: center; gap: 12px; padding: 12px; }
.v-index { font-weight: 900; color: #cbd5e1; font-size: 0.75rem; width: 30px; }
.v-info { flex: 1; font-size: 1rem; color: #1e293b; display: flex; align-items: center; gap: 8px; }
.v-playable { cursor: pointer; transition: 0.2s; }
.v-playable:hover { color: #42b983; }
.jump-link { font-size: 0.75rem; color: #42b983; cursor: pointer; text-decoration: underline; background: #eefdf5; padding: 2px 6px; border-radius: 4px; }
.v-card input { width: 150px; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px; }
.v-del { background: none; border: none; color: #cbd5e1; font-size: 1.2rem; cursor: pointer; }
.v-item-detail { background: #f8fafc; padding: 10px 15px; font-size: 0.85rem; color: #64748b; line-height: 1.5; cursor: pointer; border-top: 1px solid #f1f5f9; }
.v-item-detail.is-expanded { white-space: pre-line; color: #334155; }
.expand-label { color: #42b983; font-weight: bold; margin-left: 4px; }
.loading-state { text-align: center; color: #42b983; padding: 20px; font-weight: bold; }
.breadcrumb { font-size: 0.85rem; color: #94a3b8; margin-bottom: 15px; }
.breadcrumb a { color: #64748b; text-decoration: none; }
.mobile-drag-handle { display: none; }
.empty-tip { text-align: center; color: #94a3b8; font-size: 0.9rem; margin-bottom: 40px; }

/* 全文朗读按钮 */
.full-read-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1500;
  background: #42b983;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(66, 185, 131, 0.4);
  transition: transform 0.2s;
}
.full-read-btn:hover {
  transform: scale(1.05);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-reader { flex-direction: column; overflow-x: hidden; }
  .article-section { padding: 20px 15px 120px 15px; }
  
  .ai-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 60vh;
    z-index: 2000;
    border-left: none;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 30px rgba(0,0,0,0.1);
    padding: 0 15px env(safe-area-inset-bottom, 15px) 15px;  /* 底部安全区适配 */
    transform: translateY(calc(60vh - 45px));
    overflow: hidden;               /* 确保内容不超出圆角 */
    background: #f8fafc;            /* 与设计一致 */
  }

  .ai-panel.is-expanded {
    transform: translateY(0);
  }

  .mobile-drag-handle {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 45px;
    cursor: pointer;
  }

  .handle-icon {
    background: #eefdf5;
    color: #42b983;
    padding: 5px 20px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  /* 确保内部卡片圆角匹配面板 */
  .ai-card {
    height: calc(100% - 50px);
    border-top: none;
    border-radius: 16px 16px 0 0;   /* 统一圆角，避免边框被切 */
    margin-top: 5px;                /* 留出呼吸空间 */
  }

  .para-with-speaker { padding-left: 30px; }
  .full-read-btn {
    bottom: 90px;
    right: 15px;
    padding: 10px 18px;
    font-size: 14px;
  }
}
</style>
