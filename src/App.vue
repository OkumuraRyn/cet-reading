<template>
  <div class="app-container">
    <!-- 始终可见的菜单按钮（桌面端） -->
    <button class="desktop-menu-btn" @click="isMenuOpen = true">
      ☰
    </button>

    <!-- 移动端顶栏（仅移动端显示） -->
    <header class="mobile-navbar">
      <button class="menu-toggle" @click="isMenuOpen = !isMenuOpen">☰ 目录</button>
      <div class="brand">English Reading</div>
    </header>

    <!-- 遮罩层（菜单打开时） -->
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
      <nav class="nav-content">
          <div class="nav-group">
    <router-link
      to="/memorize"
      class="nav-link special-link"
      @click="isMenuOpen = false"
    >
      <div class="art-num">📝</div>
      <div class="art-info">
        <div class="en-title">单词默写</div>
        <div class="cn-title">Memorize & Spell</div>
      </div>
    </router-link>
  </div>
        <div v-for="(list, catName) in categorizedArticles" :key="catName" class="nav-group">
          <div class="category-label">{{ catName }}</div>
          <router-link
            v-for="art in list" :key="art.id"
            :to="`/article/${art.id}`"
            class="nav-link"
            @click="isMenuOpen = false"
          >
            <div class="art-num">#{{ art.id }}</div>
            <div class="art-info">
              <div class="en-title">{{ art.title }}</div>
              <div class="cn-title">{{ art.titleCn }}</div>
            </div>
          </router-link>
        </div>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { categorizedArticles } from './data/index';
const isMenuOpen = ref(false);
</script>

<style scoped>
.special-link.router-link-active {
  background: #eefdf5;
  border-left: none;
  border-radius: 10px;
}
/* 全局重置 */
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

/* 桌面端菜单按钮（始终可见，固定在左上角） */
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

/* 移动端顶栏（仅小屏显示） */
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

/* 遮罩 */
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

/* 侧边栏（抽屉式） */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 100vh;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  z-index: 1020;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 20px 0 50px rgba(0,0,0,0.1);
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
}

.sidebar-header h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #1e293b;
}

.mobile-close-btn {
  display: block;   /* 桌面端也显示关闭按钮 */
  border: none;
  background: none;
  font-size: 28px;
  color: #94a3b8;
  cursor: pointer;
}

.nav-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.nav-group {
  margin-bottom: 25px;
}

.category-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  padding: 8px 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-link {
  display: flex;
  gap: 12px;
  padding: 12px;
  text-decoration: none;
  border-radius: 10px;
  margin-top: 5px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: #f1f5f9;
}

.nav-link.router-link-active {
  background: #eefdf5;
  border-left: 4px solid #42b983;
}

.art-num {
  font-size: 0.8rem;
  font-weight: bold;
  color: #42b983;
}

.en-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
}

.cn-title {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 3px;
}

/* 主内容区（无固定边栏占位，自由延展） */
.main-content {
  flex: 1;
  min-width: 0;
  background: white;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .desktop-menu-btn {
    display: none;   /* 移动端隐藏浮动按钮，改用顶栏 */
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
    padding-top: 50px;   /* 留出顶栏空间 */
  }

  .sidebar {
    width: 100%;          /* 移动端全宽抽屉 */
    max-width: 320px;
  }
}
</style>