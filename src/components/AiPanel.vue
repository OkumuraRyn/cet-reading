<!-- src/components/AiPanel.vue -->
<template>
  <!-- 浮动面板外壳 -->
  <div
    class="ai-float"
    :class="{ 'is-expanded': isAiExpanded }"
    :style="{ left: panelX + 'px', top: panelY + 'px' }"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <!-- 折叠状态：圆形按钮 -->
    <div v-if="!isAiExpanded" class="float-btn" @click="isAiExpanded = true">
      🤖
    </div>

    <!-- 展开状态：卡片 -->
    <div v-else class="ai-card">
      <!-- 拖拽手柄 / 标题栏 -->
      <div class="card-header" @mousedown.stop @touchstart.stop>
        <span>AI 助手分析</span>
        <button class="close-btn" @click="isAiExpanded = false">✕</button>
      </div>

      <div class="ai-body">
        <!-- 上下文预览 -->
        <div v-if="selectedSentence" class="context-preview">
          <small>当前句子</small>
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
          placeholder="输入你的问题..."
          @keyup.enter="handleQuestionSubmit"
        />
        <button @click="handleQuestionSubmit" :disabled="!userQuestion.trim()">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
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

  const cached = getCachedResult('quest', question, props.selectedSentence)
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

// ==================== 拖拽管理 ====================
const panelX = ref(window.innerWidth - 80) // 默认右下角
const panelY = ref(window.innerHeight - 80)
let dragging = false
let startX = 0
let startY = 0

const startDrag = (e) => {
  // 只允许拖拽标题栏，或折叠按钮本身
  if (e.target.closest('.card-header') || e.target.closest('.float-btn')) {
    dragging = true
    const touch = e.touches ? e.touches[0] : e
    startX = touch.clientX - panelX.value
    startY = touch.clientY - panelY.value
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchmove', onDrag, { passive: false })
    document.addEventListener('touchend', stopDrag)
    e.preventDefault()
  }
}

const onDrag = (e) => {
  if (!dragging) return
  const touch = e.touches ? e.touches[0] : e
  panelX.value = Math.min(Math.max(touch.clientX - startX, 0), window.innerWidth - 40)
  panelY.value = Math.min(Math.max(touch.clientY - startY, 0), window.innerHeight - 40)
}

const stopDrag = () => {
  dragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

onBeforeUnmount(() => {
  stopDrag()
})

// 暴露 isAiExpanded 给父组件（ArticleView 需要直接控制展开）
defineExpose({ isAiExpanded })
</script>

<style scoped>
/* ========== 浮动容器 ========== */
.ai-float {
  position: fixed;
  z-index: 899; /* 低于侧边栏遮罩 1000，高于内容 */
  transition: none;
  user-select: none;
}

/* 折叠状态圆形按钮 */
.float-btn {
  width: 48px;
  height: 48px;
  background: #42b983;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
  transition: transform 0.2s;
}
.float-btn:hover {
  transform: scale(1.1);
}

/* 展开状态卡片 */
.ai-card {
  width: 340px;
  max-height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  background: #42b983;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  font-weight: bold;
  flex-shrink: 0;
}
.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #475569;
}

/* 其余样式保持之前的 context-preview、result-area、loading-state、empty-state 不变 */
/* （此处省略，保持和原来一样的样式） */

.context-preview {
  background: #f1f5f9;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 4px solid #cbd5e1;
}
.context-preview small {
  color: #94a3b8;
  font-size: 0.75rem;
}
.translation-preview {
  color: #42b983;
  margin-top: 8px;
  font-weight: 500;
  border-top: 1px dashed #cbd5e1;
  padding-top: 5px;
}

.result-area {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.ai-word-title {
  font-weight: 900;
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 10px;
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
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 20px 0;
}
.loading-state {
  text-align: center;
  color: #42b983;
  padding: 20px;
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
  to { transform: rotate(360deg); }
}

.ai-input-group {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}
.ai-input-group input {
  flex: 1;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-size: 0.9rem;
}
.ai-input-group button {
  background: #42b983;
  color: white;
  border: none;
  padding: 0 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .ai-card {
    width: 90vw;
    max-height: 60vh;
  }
  .float-btn {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
}
</style>
