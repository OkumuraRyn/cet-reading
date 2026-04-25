<!-- src/views/MemorizeView.vue -->
<template>
  <div class="memorize-container">
    <div class="sticky-header">
      <div class="stats">
        <span>全部: <span class="num">{{ words.length }}</span></span>
        <span class="stat-item correct">正确: <span class="num">{{ correctCount }}</span></span>
        <span class="stat-item wrong">错误: <span class="num">{{ wrongCount }}</span></span>
      </div>
      <div class="controls">
        <button @click="currentMode = 'browse'" :class="{ active: currentMode === 'browse' }">👀 预览模式</button>
        <button @click="currentMode = 'spell'" :class="{ active: currentMode === 'spell' }">⌨️ 拼写练习</button>
        <button @click="maskEng = !maskEng" :class="{ active: maskEng }">🙈 遮盖英文</button>
        <button @click="maskChi = !maskChi" :class="{ active: maskChi }">🙊 遮盖中文</button>
        <button class="btn-mistake" @click="filterMistake = !filterMistake">
          {{ filterMistake ? 'Show All' : '只看错题' }}
        </button>
        <button class="btn-reset" @click="resetAll">重置全部</button>
      </div>
    </div>

    <div class="word-list">
      <div
        v-for="(word, index) in displayWords"
        :key="word.e"
        class="word-card"
        :class="{ 'card-wrong': word.status === 'wrong', 'card-correct': word.status === 'correct' }"
      >
        <!-- 英文区域 -->
        <div class="eng-area">
          <template v-if="currentMode === 'spell'">
            <input
              type="text"
              placeholder="拼写单词..."
              @blur="checkSpell($event, word)"
              @keyup.enter="handleEnter($event, word)"
              :class="{ error: word.status === 'wrong' }"
            >
          </template>
          <template v-else>
            <span
              class="word-text"
              :class="{ mask: maskEng }"
              @click="speak(word.e)"
            >{{ word.e }}</span>
            <span class="ipa">{{ word.i }}</span>
            <span class="mini-speaker" @click="speak(word.e)">🔊</span>
          </template>
        </div>

        <!-- 中文区域 -->
        <div class="chi-area">
          <span
            class="chi-text"
            :class="{ mask: maskChi }"
            @click="toggleRevealed"
          >{{ word.c }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { memorizeWords } from '../data/Vocab/v1.js';

// ==================== 本地缓存管理 ====================
const STORAGE_KEY = 'cet_memorize_progress';

// 读取缓存（返回对象，键为单词英文小写，值为 'correct' | 'wrong' | undefined）
const loadProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// 保存缓存（只存储状态，减小体积）
const saveProgress = (wordsArray) => {
  const progress = {};
  wordsArray.forEach(w => {
    // 只保存有状态的单词（减少存储量）
    if (w.status !== 'none') {
      progress[w.e.toLowerCase()] = w.status;
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

// ==================== 初始状态 ====================
const currentMode = ref('browse'); // browse, spell
const maskEng = ref(false);
const maskChi = ref(false);
const filterMistake = ref(false);

// 从缓存恢复状态
const cached = loadProgress();
const words = reactive(
  memorizeWords.map(w => ({
    ...w,
    status: cached[w.e.toLowerCase()] || 'none'  // 使用缓存的状态，默认 'none'
  }))
);

// 初始化后同步一次缓存（保证后续操作前缓存是完整的）
onMounted(() => {
  saveProgress(words);
});

// ==================== 计算属性 ====================
const displayWords = computed(() => {
  if (filterMistake.value) {
    return words.filter(w => w.status === 'wrong');
  }
  return words;
});

const correctCount = computed(() => words.filter(w => w.status === 'correct').length);
const wrongCount = computed(() => words.filter(w => w.status === 'wrong').length);

// ==================== 朗读功能 ====================
const speak = (content) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(content);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

// ==================== 拼写检查（核心：每次检查后保存缓存） ====================
// 检查拼写：只判断对错，输入为空时不改变任何状态
const checkSpell = (e, wordObj) => {
  const userValue = e.target.value.trim().toLowerCase();
  
  // 如果输入为空，不做任何操作，保留原有状态
  if (!userValue) {
    return;
  }

  if (userValue === wordObj.e.toLowerCase()) {
    // 只有在之前不是正确状态时才标记，避免重复朗读
    if (wordObj.status !== 'correct') {
        wordObj.status = 'correct';
        speak(wordObj.e);
        saveProgress(words);     // 状态改变后保存
    }
  } else {
    // 拼写错误，标记为掌握
    wordObj.status = 'wrong';
    saveProgress(words);     // 状态改变后保存
  }
};

const handleEnter = (e, wordObj) => {
  checkSpell(e, wordObj);
  // 自动聚焦下一个输入框
  const inputs = Array.from(document.querySelectorAll('input'));
  const idx = inputs.indexOf(e.target);
  if (idx < inputs.length - 1) inputs[idx + 1].focus();
};

const toggleRevealed = (e) => {
  e.target.classList.toggle('revealed');
};

// ==================== 重置全部（同时清空缓存） ====================
const resetAll = () => {
  if (confirm("确定要清空所有进度吗？")) {
    words.forEach(w => w.status = 'none');
    document.querySelectorAll('input').forEach(i => i.value = '');
    localStorage.removeItem(STORAGE_KEY);   // ✅ 清空缓存
  }
};

// 组件销毁时取消朗读
onUnmounted(() => {
  window.speechSynthesis.cancel();
});
</script>

<style scoped>
.memorize-container { max-width: 900px; margin: 0 auto; padding: 20px; min-height: 100vh; }

.sticky-header {
  position: sticky; top: 10px; background: white; padding: 20px;
  border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  z-index: 100; margin-bottom: 30px; text-align: center;
  border: 1px solid #eef2f6;
}

.stats { display: flex; justify-content: center; gap: 30px; margin-bottom: 15px; font-weight: 800; font-size: 1.1rem; }
.num { color: #4a90e2; }
.correct { color: #2ecc71; }
.wrong { color: #e74c3c; }

.controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

button {
  padding: 10px 18px; border: none; border-radius: 10px; cursor: pointer;
  font-size: 14px; transition: 0.3s; background: #f1f5f9; color: #64748b;
  font-weight: 600;
}

button.active { background: #4a90e2; color: white; box-shadow: 0 4px 12px rgba(74,144,226,0.3); }
button:hover { transform: translateY(-2px); }

.btn-mistake { background: #fff1f1; color: #e74c3c; border: 1px solid #ffcfcf; }
.btn-reset { color: #94a3b8; text-decoration: underline; background: none; }

.word-card {
  background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px;
  display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; align-items: center;
  border: 2px solid #f1f5f9; transition: 0.3s;
}

.card-wrong { border-color: #ffcfcf; background: #fffafa; }
.card-correct { border-color: #d1fae5; background: #f0fdf4; }

.eng-area { font-size: 1.25rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; }
.word-text { cursor: pointer; }
.mini-speaker { font-size: 0.9rem; cursor: pointer; opacity: 0.4; transition: 0.2s; }
.mini-speaker:hover { opacity: 1; color: #4a90e2; }
.ipa { font-size: 0.9rem; color: #94a3b8; font-weight: 400; font-family: 'Arial'; }
.chi-text { color: #475569; line-height: 1.5; font-size: 1rem; cursor: pointer; }

/* 遮盖特效 */
.mask { background: #e2e8f0 !important; color: transparent !important; border-radius: 6px; user-select: none; }
.mask:hover { background: #cbd5e1 !important; }
.mask.revealed { background: transparent !important; color: inherit !important; }

input[type="text"] {
  width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;
  font-size: 1.1rem; outline: none; transition: 0.2s;
}

input.error { border-color: #e74c3c; background: #fff1f1; }
input:focus { border-color: #4a90e2; }

@media (max-width: 600px) {
  .word-card { grid-template-columns: 1fr; gap: 10px; }
  .sticky-header { padding: 15px; top: 0; border-radius: 0; }
}
</style>
