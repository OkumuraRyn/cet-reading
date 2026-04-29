<!-- src/components/AiPanel.vue -->
<template>
  <aside class="ai-panel" :class="{ 'is-expanded': isAiExpanded }">
    <!-- 移动端拖拽手柄 -->
    <div class="mobile-drag-handle" @click="isAiExpanded = !isAiExpanded">
      <span class="handle-icon">
        {{ isAiExpanded ? '▼ 收起分析' : '▲ 展开 AI 分析' }}
      </span>
    </div>

    <div class="ai-card">
      <div class="ai-header">AI 助手分析</div>

      <!-- 滚动内容区 -->
      <div class="ai-scroll-content">
        <!-- 上下文预览 -->
        <div v-if="selectedSentence" class="context-preview">
          <small>当前分析句子：</small>
          <p>{{ selectedSentence }}</p>
          <p v-if="selectedSentenceCn" class="translation-preview">
            {{ selectedSentenceCn }}
          </p>
        </div>

        <!-- 加载中 -->
        <div v-if="studyStore.isAiLoading" class="loading-state">
          <span class="loading-spinner"></span>
          深度分析中...
        </div>

        <!-- AI 分析结果 -->
        <div v-else-if="studyStore.currentDictEntry" class="result-area">
          <div class="ai-word-title">
            {{ studyStore.currentDictEntry.word || '分析结果' }}
          </div>
          <div class="ai-res-detail">
            {{ studyStore.currentDictEntry.detail }}
          </div>
          <button
            v-if="studyStore.currentDictEntry.word"
            class="save-word-btn"
            @click="$emit('add-to-vocab')"
          >
            + 存入本篇默写本
          </button>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">📖</div>
          <p>长按单词深度解析</p>
          <p>单击选中句子进行提问</p>
        </div>
      </div>

      <!-- 提问输入 -->
      <div class="ai-input-group">
        <input
          type="text"
          v-model="userQuestion"
          :placeholder="
            selectedSentence ? '问问这句的语法...' : '输入你的问题...'
          "
          @keyup.enter="handleQuestionSubmit"
        />
        <button @click="handleQuestionSubmit" :disabled="!userQuestion.trim()">
          发送
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useStudyStore } from '../store/studyStore'
import { askAiQuestion, getCachedResult } from '../services/aiService'

const props = defineProps({
  selectedSentence: { type: String, default: '' },
  selectedSentenceCn: { type: String, default: '' },
})

const emit = defineEmits(['add-to-vocab'])

const studyStore = useStudyStore()
const isAiExpanded = ref(false)
const userQuestion = ref('')

// ==================== 提问处理 ====================
const handleQuestionSubmit = async () => {
  const question = userQuestion.value.trim()
  if (!question) return

  isAiExpanded.value = true

  // 检查缓存（7 天有效期已在 aiService 中处理）
  const cached = getCachedResult(
    'quest',
    question,
    props.selectedSentence
  )
  if (cached) {
    studyStore.currentDictEntry = { word: '', detail: cached }
    userQuestion.value = ''
    return
  }

  studyStore.isAiLoading = true
  studyStore.currentDictEntry = null

  try {
    const res = await askAiQuestion(question, props.selectedSentence)
    studyStore.currentDictEntry = { word: '', detail: res }
  } catch (err) {
    studyStore.currentDictEntry = {
      word: '',
      detail: `❌ 分析失败：${err.message || '网络错误，请稍后再试'}`,
    }
  } finally {
    studyStore.isAiLoading = false
    userQuestion.value = ''
  }
}

// 暴露 isAiExpanded 给父组件（ArticleView 需要直接控制展开）
defineExpose({ isAiExpanded })
</script>

<style scoped>
/* ========== AI 面板 ========== */
.ai-panel {
  width: 380px;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.ai-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1.5px solid #42b983;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* ========== 标题 ========== */
.ai-header {
  font-weight: 800;
  color: #42b983;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

/* ========== 滚动内容 ========== */
.ai-scroll-content {
  flex: 1;
  overflow-y: auto;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #475569;
}

/* ========== 上下文预览 ========== */
.context-preview {
  background: #f1f5f9;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid #cbd5e1;
}
.context-preview small {
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.context-preview p {
  margin: 5px 0 0 0;
  font-size: 0.9rem;
}
.translation-preview {
  color: #42b983;
  margin-top: 8px !important;
  font-weight: 500;
  border-top: 1px dashed #cbd5e1;
  padding-top: 5px;
}

/* ========== 分析结果 ========== */
.result-area {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-word-title {
  font-weight: 900;
  font-size: 1.2rem;
  color: #1e293b;
  margin-bottom: 10px;
  text-transform: capitalize;
}

.ai-res-detail {
  white-space: pre-line;
  margin-bottom: 20px;
}

.save-word-btn {
  width: 100%;
  background: #42b983;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.save-word-btn:hover {
  background: #34a871;
}
.save-word-btn:active {
  transform: scale(0.98);
}

/* ========== 空状态 ========== */
.empty-state {
  color: #94a3b8;
  text-align: center;
  margin-top: 50px;
}
.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}
.empty-state p {
  margin: 5px 0;
  font-size: 0.9rem;
}

/* ========== 加载状态 ========== */
.loading-state {
  text-align: center;
  color: #42b983;
  padding: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #42b983;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 提问输入 ========== */
.ai-input-group {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}
.ai-input-group input {
  flex: 1;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}
.ai-input-group input:focus {
  border-color: #42b983;
}
.ai-input-group button {
  background: #42b983;
  color: white;
  border: none;
  padding: 0 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}
.ai-input-group button:hover:not(:disabled) {
  background: #34a871;
}
.ai-input-group button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

/* ========== 移动端拖拽手柄 ========== */
.mobile-drag-handle {
  display: none;
}

/* ========== 移动端 ========== */
@media (max-width: 768px) {
  .ai-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 60vh;
    z-index: 899;  /* ✅ 从 2000 改为 899，低于遮罩层 1000 */
    border-left: none;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.1);
    padding: 0 15px env(safe-area-inset-bottom, 15px) 15px;
    transform: translateY(calc(60vh - 45px));
    overflow: hidden;
    background: #f8fafc;
    transition: transform 0.3s ease;
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
    flex-shrink: 0;
  }

  .handle-icon {
    background: #eefdf5;
    color: #42b983;
    padding: 5px 20px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .ai-card {
    height: calc(100% - 50px);
    border-radius: 16px 16px 0 0;
    margin-top: 5px;
  }
}
</style>
