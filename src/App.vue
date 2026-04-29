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

      <!-- ========== 树状目录导航（核心改动） ========== -->
      <nav class="nav-content">
        <!-- 单词默写（特殊入口） -->
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
        <div v-for="(articles, category) in categorizedArticles" :key="category" class="tree-group">
          <!-- 分类标题（可点击展开/收起） -->
          <div class="tree-parent" @click="toggleCategory(category)">
            <span class="tree-arrow" :class="{ expanded: expandedCategories.has(category) }">
              {{ expandedCategories.has(category) ? '▾' : '▸' }}
            </span>
            <span class="category-name">{{ category }}</span>
            <span class="category-count">{{ articles.length }}</span>
          </div>

          <!-- 子文章列表（带折叠动画） -->
          <Transition name="tree-slide">
            <div v-if="expandedCategories.has(category)" class="tree-children">
              <router-link
                v-for="art in articles"
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
      </nav>
      <div style="padding: 10px 12px; border-top: 1px solid #e2e8f0; margin-top: auto;">
  <input
    type="password"
    placeholder="输入 DeepSeek API Key"
    @blur="saveApiKey"
    style="width: 100%; padding: 6px; font-size: 0.8rem; border: 1px solid #ccc; border-radius: 4px;"
  />
</div>
      <!-- ========== 树状目录结束 ========== -->
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { categorizedArticles } from './data/index';

const isMenuOpen = ref(false);

  const saveApiKey = (e) => {
  const key = e.target.value.trim();
  if (key) {
    localStorage.setItem('deepseek_api_key', key);
  }
};

// 默认展开第一个分类
const expandedCategories = reactive(new Set());
const firstCategory = Object.keys(categorizedArticles)[0];
if (firstCategory) expandedCategories.add(firstCategory);

// 切换分类展开/收起
const toggleCategory = (category) => {
  if (expandedCategories.has(category)) {
    expandedCategories.delete(category);
  } else {
    expandedCategories.add(category);
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

/* 分类组 */
.tree-group {
  margin-bottom: 4px;
}

/* 分类标题（父节点） */
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

/* 三角箭头 */
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

/* 分类名称 */
.category-name {
  flex: 1;
}

/* 文章数量标签 */
.category-count {
  background: #e2e8f0;
  color: #64748b;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

/* 子节点容器 */
.tree-children {
  padding-left: 12px;
  border-left: 2px solid #e2e8f0;
  margin-left: 20px;
  overflow: hidden;
}

/* 展开/收起动画 */
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

/* 子节点链接 */
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

/* 普通导航链接 */
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

/* 特殊链接（默写） */
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

/* 图标 */
.nav-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

/* 文字信息 */
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
</style>
