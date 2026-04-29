<!-- src/components/AiPanel.vue -->
<template>
  <div
    class="ai-float"
    :class="{
      'is-expanded': isAiExpanded,
      'is-mobile': isMobile,
      'is-dragging': dragging,
    }"
    :style="!isMobile ? { left: panelX + 'px', top: panelY + 'px' } : {}"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <!-- 折叠按钮（桌面端通过拖拽逻辑展开，移动端 click 直接展开） -->
    <div
      v-if="!isAiExpanded"
      class="float-btn"
      @click.stop="isMobile && (isAiExpanded = true)"
    >
      Ai
    </div>

    <!-- 展开卡片（毛玻璃效果 + 透明标题栏） -->
    <div v-else class="ai-card glass-card">
      <div class="card-header" @mousedown.stop @touchstart.stop>
        <span>AI 助手分析</span>
        <button class="close-btn" @click="isAiExpanded = false">✕</button>
      </div>

      <div class="ai-body">
        <div v-if="selectedSentence" class="context-preview">
          <small>当前句子</small>
          <p>{{ selectedSentence }}</p>
          <p v-if="selectedSentenceCn" class="translation-preview">
            {{ selectedSentenceCn }}
          </p>
        </div>

        <div v-if="studyStore.isAiLoading" class="loading-state">
          <span class="loading-spinner"></span>
          深度分析中...
        </div>
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
        <div v-else class="empty-state">
          <div class="empty-icon">📖</div>
          <p>长按单词深度解析</p>
          <p>单击选中句子进行提问</p>
        </div>
      </div>

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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useStudyStore } from '../store/studyStore'
import { askAiQuestion, getCachedResult } from '../services/aiService'

const props = defineProps({
  selectedSentence: { type: String, default: '' },
  selectedSentenceCn: { type: String, default: '' },
  // 新增朗读相关属性
  readingState: { type: String, default: 'idle' },
  onToggleFullReading: { type: Function, default: () => {} },
  onStopFullReading: { type: Function, default: () => {} },
})

const emit = defineEmits(['add-to-vocab'])

const studyStore = useStudyStore()
const isAiExpanded = ref(false)
const userQuestion = ref('')

// 朗读状态映射（原样显示）
const displayReadingState = computed(() => props.readingState)

const handleToggleReading = () => {
  props.onToggleFullReading()
}
const handleStopReading = () => {
  props.onStopFullReading()
}

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

// ==================== 移动端检测 ====================
const isMobile = ref(window.innerWidth <= 768)
const updateMobile = () => {
  isMobile.value = window.innerWidth <= 768
}
window.addEventListener('resize', updateMobile)
onBeforeUnmount(() => window.removeEventListener('resize', updateMobile))

// ==================== 桌面端拖拽 ====================
const panelX = ref(window.innerWidth - 420)
const panelY = ref(window.innerHeight - 480)
const dragging = ref(false)
const hasMoved = ref(false)
const DRAG_THRESHOLD = 5 // 移动超过此像素才算拖拽

let dragSource = null // 'float' | 'header'
let startX = 0
let startY = 0

const setDefaultPosition = () => {
  if (!isMobile.value) {
    panelX.value = Math.max(20, window.innerWidth - 420)
    panelY.value = Math.max(20, window.innerHeight - 480)
  }
}
onMounted(setDefaultPosition)
window.addEventListener('resize', setDefaultPosition)
onBeforeUnmount(() => window.removeEventListener('resize', setDefaultPosition))

const startDrag = (e) => {
  if (isMobile.value) return // 移动端禁用拖拽

  const headerEl = e.target.closest('.card-header')
  const floatBtnEl = e.target.closest('.float-btn')
  if (!headerEl && !floatBtnEl) return

  dragging.value = true
  hasMoved.value = false
  dragSource = headerEl ? 'header' : 'float'

  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  startX = clientX - panelX.value
  startY = clientY - panelY.value

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
  e.preventDefault()
}

const onDrag = (e) => {
  if (!dragging.value) return
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY

  const newX = clientX - startX
  const newY = clientY - startY

  panelX.value = Math.min(Math.max(newX, 0), window.innerWidth - 60)
  panelY.value = Math.min(Math.max(newY, 0), window.innerHeight - 60)

  // 判断是否移动超过阈值
  if (Math.abs(newX - panelX.value) > DRAG_THRESHOLD || Math.abs(newY - panelY.value) > DRAG_THRESHOLD) {
    hasMoved.value = true
  }
}

const stopDrag = () => {
  dragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)

  // 桌面端 float 按钮：未移动视为点击，展开面板
  if (dragSource === 'float' && !hasMoved.value && !isMobile.value) {
    isAiExpanded.value = true
  }
  dragSource = null
}

onBeforeUnmount(stopDrag)

defineExpose({ isAiExpanded })
</script>

<style scoped>
  .mobile-reading-controls {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(241, 245, 249, 0.6);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  flex-shrink: 0;
}
.mobile-reading-controls button {
  flex: 1;
  padding: 8px;
  border: 1px solid #42b983;
  background: rgba(66, 185, 131, 0.1);
  color: #2e865f;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.mobile-reading-controls button:hover {
  background: rgba(66, 185, 131, 0.2);
}
/* ========== 浮动容器 ========== */
.ai-float {
  position: fixed;
  z-index: 899;
  user-select: none;
}

/* 折叠按钮 */
.float-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #42b983, #2e865f);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(66, 185, 131, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.float-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(66, 185, 131, 0.5);
}

/* 毛玻璃卡片 */
.ai-card {
  width: 360px;
  max-height: 520px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

/* 半透明毛玻璃标题栏 */
.card-header {
  background: rgba(66, 185, 131, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 1rem;
  cursor: move;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}
.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.close-btn:hover {
  opacity: 1;
}

.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #334155;
}

/* 上下文预览 */
.context-preview {
  background: rgba(241, 245, 249, 0.7);
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 12px;
  border-left: 4px solid #42b983;
}
.context-preview small { color: #64748b; font-size: 0.75rem; }
.translation-preview {
  color: #42b983;
  margin-top: 8px;
  font-weight: 500;
  border-top: 1px dashed rgba(0,0,0,0.1);
  padding-top: 5px;
}

/* 结果动画 */
.result-area { animation: fadeIn 0.3s ease; }
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
  word-break: break-word;
}
.save-word-btn {
  width: 100%;
  background: #42b983;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.save-word-btn:hover { background: #2e865f; }

/* 空状态 */
.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 30px 0;
}
.empty-icon { font-size: 2rem; margin-bottom: 8px; }

/* 加载 */
.loading-state {
  text-align: center;
  color: #42b983;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
}
.loading-spinner {
  width: 18px; height: 18px;
  border: 3px solid rgba(66,185,131,0.2);
  border-top: 3px solid #42b983;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 输入区域 */
.ai-input-group {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(0,0,0,0.05);
  background: rgba(255,255,255,0.6);
  flex-shrink: 0;
}
.ai-input-group input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  outline: none;
  font-size: 0.9rem;
  background: rgba(255,255,255,0.9);
}
.ai-input-group button {
  background: #42b983;
  color: white;
  border: none;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.ai-input-group button:hover:not(:disabled) { background: #2e865f; }
.ai-input-group button:disabled { background: #cbd5e1; cursor: not-allowed; }

/* ========== 移动端 ========== */
@media (max-width: 768px) {
  .ai-float {
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    top: auto !important;
    z-index: 899;
  }
  .float-btn {
    position: absolute;
    right: 20px;
    bottom: 20px;
    width: 46px;
    height: 46px;
    font-size: 22px;
  }
  .ai-card {
    width: 100%;
    max-height: 60vh;
    border-radius: 20px 20px 0 0;
  }
}
</style>
