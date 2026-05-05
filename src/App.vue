<!-- src/App.vue -->
<template>
  <div class="app-container">
    <!-- 桌面端菜单按钮 -->
    <button class="desktop-menu-btn" @click="isMenuOpen = true">☰</button>

    <!-- 移动端顶栏 -->
    <header class="mobile-navbar">
      <button class="menu-toggle" @click="isMenuOpen = !isMenuOpen">☰ 目录</button>
      <div class="brand">English Reading</div>
    </header>

    <!-- 遮罩层 -->
    <div
      class="menu-overlay"
      :class="{ 'is-active': isMenuOpen }"
      @click="isMenuOpen = false"
    ></div>

    <!-- 抽屉式侧边栏 -->
    <aside class="sidebar" :class="{ 'is-open': isMenuOpen }">
      <div class="sidebar-header">
        <router-link to="/" @click="isMenuOpen = false" style="text-decoration:none; color:inherit">
          <h2>📚 学习目录</h2>
        </router-link>
        <button class="mobile-close-btn" @click="isMenuOpen = false">×</button>
      </div>
      <div class="api-key-area">
        <input
          type="password"
          placeholder="🔑 输入 DeepSeek API Key"
          :value="apiKey"
          @blur="saveApiKey"
          class="api-key-input"
        />
      </div>
      <nav class="nav-content">
        <!-- 单词默写 -->
        <router-link
          to="/memorize"
          class="nav-link special-link"
          @click="isMenuOpen = false"
        >
          <span class="nav-icon">📝</span>
          <div class="nav-info">
            <div class="en-title">单词默写</div>
            <div class="cn-title">Memorize & Spell</div>
          </div>
        </router-link>

        <!-- 分类树 -->
        <div v-for="(group, parentName) in categoryTreeData" :key="parentName" class="tree-group">
  <!-- 父分类 -->
  <div class="tree-parent" @click="toggleCategory(parentName)">
    <span class="tree-arrow" :class="{ expanded: expandedCategories.has(parentName) }">
      {{ expandedCategories.has(parentName) ? '▾' : '▸' }}
    </span>
    <span class="category-name">{{ parentName }}</span>
    <span class="category-count">{{ countParentArticles(group) }}</span>
  </div>

  <Transition name="tree-slide">
    <div v-if="expandedCategories.has(parentName)" class="tree-children">
      <!-- 普通文章 -->
      <router-link
        v-for="art in group.articles"
        :key="art.id"
        :to="`/article/${art.id}`"
        class="nav-link tree-child"
        @click="isMenuOpen = false"
      >
        <span class="nav-icon">📄</span>
        <div class="nav-info">
          <div class="en-title">#{{ art.id }} {{ art.title }}</div>
          <div class="cn-title" v-if="art.titleCn">{{ art.titleCn }}</div>
        </div>
      </router-link>

      <!-- 子分类 -->
      <div v-for="(sub, subName) in group.subGroups" :key="subName" class="sub-group">
        <div class="tree-parent sub-parent" @click.stop="toggleCategory(subName)">
          <span class="tree-arrow" :class="{ expanded: expandedCategories.has(subName) }">
            {{ expandedCategories.has(subName) ? '▾' : '▸' }}
          </span>
          <span class="category-name">{{ subName }}</span>
          <span class="category-count">{{ sub.articles.length }}</span>
        </div>
        <Transition name="tree-slide">
          <div v-if="expandedCategories.has(subName)" class="tree-children sub-children">
            <router-link
              v-for="art in sub.articles"
              :key="art.id"
              :to="`/article/${art.id}`"
              class="nav-link tree-child"
              @click="isMenuOpen = false"
            >
              <span class="nav-icon">📄</span>
              <div class="nav-info">
                <div class="en-title">#{{ art.id }} {{ art.title }}</div>
                <div class="cn-title" v-if="art.titleCn">{{ art.titleCn }}</div>
              </div>
            </router-link>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</div>
    <!-- 主内容区 -->
    <main class="main-content" :class="{ 'hide-ai-panel': isMenuOpen }">
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { categoryTreeData } from './data/index';

const isMenuOpen = ref(false);

// ✅ 改动：默认全部合上，不展开任何分类
const expandedCategories = reactive(new Set());

const countParentArticles = (group) => {
  let total = group.articles.length;
  for (const sub of Object.values(group.subGroups)) {
    total += sub.articles.length;
  }
  return total;
};

// API Key 管理
const apiKey = ref(localStorage.getItem('deepseek_api_key') || '');
const saveApiKey = (e) => {
  const val = e.target.value.trim();
  if (val) {
    localStorage.setItem('deepseek_api_key', val);
    apiKey.value = val;
  }
};
</script>

<style scoped>
/* ============ 全局重置 ============ */
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #334155;
  background: white;
}

.app-container {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* ============ 桌面端菜单按钮 ============ */
.desktop-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1010;
  width: 42px;
  height: 42px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
  transition: transform 0.2s;
}
.desktop-menu-btn:hover {
  transform: scale(1.05);
}

/* ============ 移动端顶栏 ============ */
.mobile-navbar {
  display: none;
}
.menu-toggle {
  background: #42b983;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.brand {
  font-weight: bold;
  color: #475569;
}

/* ============ 遮罩 ============ */
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s;
}
.menu-overlay.is-active {
  opacity: 1;
  visibility: visible;
}

/* ============ 侧边栏（抽屉式） ============ */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 340px;
  height: 100vh;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  z-index: 1020;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 20px 0 50px rgba(0,0,0,0.1);
  overflow: hidden;
}
.sidebar.is-open {
  transform: translateX(0);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.sidebar-header h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #1e293b;
}
.mobile-close-btn {
  display: block;
  border: none;
  background: none;
  font-size: 28px;
  color: #94a3b8;
  cursor: pointer;
}

/* ============ 导航内容区（可滚动） ============ */
.nav-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
}

/* ============ 树状目录样式 ============ */
.tree-group {
  margin-bottom: 4px;
}

.tree-parent {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  border-radius: 8px;
  transition: background 0.15s;
  font-weight: 600;
  font-size: 0.85rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tree-parent:hover {
  background: #eef2f6;
}

.tree-arrow {
  font-size: 0.75rem;
  width: 16px;
  text-align: center;
  transition: transform 0.2s;
  color: #94a3b8;
  flex-shrink: 0;
}
.tree-arrow.expanded {
  color: #42b983;
}

.category-name {
  flex: 1;
}

.category-count {
  background: #e2e8f0;
  color: #64748b;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.tree-children {
  padding-left: 12px;
  border-left: 2px solid #e2e8f0;
  margin-left: 20px;
  overflow: hidden;
}

.tree-slide-enter-active,
.tree-slide-leave-active {
  transition: all 0.25s ease;
  max-height: 2000px;
}
.tree-slide-enter-from,
.tree-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.tree-child {
  padding: 8px 12px !important;
  margin-top: 0 !important;
  margin-bottom: 2px;
  border-radius: 6px !important;
  border-left: none !important;
}
.tree-child:hover {
  background: #f1f5f9 !important;
}
.tree-child.router-link-active {
  background: #eefdf5 !important;
  border-left: 3px solid #42b983 !important;
}

.nav-link {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  text-decoration: none;
  border-radius: 8px;
  margin-top: 3px;
  transition: all 0.15s ease;
  align-items: flex-start;
}
.nav-link:hover {
  background: #f1f5f9;
}
.nav-link.router-link-active {
  background: #eefdf5;
}

.special-link {
  margin-bottom: 16px;
  border: 1px dashed #d1fae5;
  background: #f9fefb;
}
.special-link:hover {
  background: #eefdf5;
}
.special-link.router-link-active {
  background: #eefdf5;
  border-color: #42b983;
}

.nav-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.nav-info {
  min-width: 0;
}
.en-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cn-title {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============ 主内容区 ============ */
.main-content {
  flex: 1;
  min-width: 0;
  background: white;
}

/* ============ 菜单打开时隐藏 AI 面板和朗读按钮 ============ */
/* ✅ 改动：统一处理，在移动端完全隐藏 AI 面板，在桌面端隐藏浮动按钮 */
.hide-ai-panel :deep(.full-read-btn),
.hide-ai-panel :deep(.mobile-drag-handle) {
  display: none !important;
}
  /* 菜单打开时隐藏 AI 面板、朗读按钮等 */
.hide-ai-panel :deep(.ai-float) {
  display: none !important;
}
.hide-ai-panel :deep(.full-read-btn),
.hide-ai-panel :deep(.mobile-drag-handle) {
  display: none !important;
}

/* 移动端：菜单打开时完全隐藏底部 AI 面板，避免穿透遮罩 */
@media (max-width: 768px) {
  .hide-ai-panel :deep(.ai-panel) {
    display: none !important;
  }
}

/* ============ 移动端适配 ============ */
@media (max-width: 768px) {
  .desktop-menu-btn {
    display: none;
  }
  .mobile-navbar {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    z-index: 900;
    align-items: center;
    padding: 0 15px;
    justify-content: space-between;
  }
  .main-content {
    padding-top: 50px;
  }
  .sidebar {
    width: 100%;
    max-width: 320px;
  }
}

.api-key-area {
  padding: 8px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.api-key-input {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  outline: none;
  background: white;
}
.api-key-input:focus {
  border-color: #42b983;
}

  .sub-parent {
  padding-left: 24px;
  font-weight: 600;
  font-size: 0.82rem;
}
.sub-children {
  margin-left: 24px;
}
</style>
