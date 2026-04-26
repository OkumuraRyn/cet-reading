<template>
  <div class="home-container">
    <header class="home-header">
      <div class="header-content">
        <h1>CET Reading Mastery</h1>
        <p>DeepSeek AI 驱动的沉浸式阅读系统</p>
      </div>
      <div class="stat-card">
        <div class="stat-item">
          <span class="stat-num">{{ studyStore.vocabularyList.length }}</span>
          <span class="stat-label">总计词汇</span>
        </div>
        <div class="stat-actions">
          <router-link to="/all-vocabulary" class="all-vocab-btn">管理全量词本</router-link>
          <router-link to="/memorize" class="all-vocab-btn">📝 单词默写</router-link>
          <button class="clear-btn" @click="studyStore.clearAll()">清空记录</button>
        </div>
      </div>
    </header>

    <!-- ========== 树状分类展示 ========== -->
    <section v-for="(articles, category) in categorizedArticles" :key="category" class="category-section">
      <!-- 分类标题（可点击展开/收起） -->
      <h2 class="category-title" @click="toggleCategory(category)">
        <span class="tree-arrow" :class="{ expanded: expandedCategories.has(category) }">
          {{ expandedCategories.has(category) ? '▾' : '▸' }}
        </span>
        {{ category }}
        <span class="category-count">{{ articles.length }} 篇</span>
      </h2>

      <!-- 文章网格（带折叠动画） -->
      <Transition name="home-slide">
        <div v-if="expandedCategories.has(category)" class="article-grid">
          <router-link
            v-for="art in articles"
            :key="art.id"
            :to="`/article/${art.id}`"
            class="article-card"
          >
            <div class="card-tag">{{ art.type }}</div>
            <h2 class="card-title">#{{ art.id }} {{ art.title }}</h2>
            <p class="card-subtitle" v-if="art.titleCn">{{ art.titleCn }}</p>
            <div class="card-footer">
              <span>{{ art.paragraphs.length }} 段落</span>
              <span class="go-read">开始阅读 →</span>
            </div>
          </router-link>
        </div>
      </Transition>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { categorizedArticles } from '../data/index';
import { studyStore } from '../store/studyStore';

// 默认展开第一个分类
const expandedCategories = reactive(new Set());
const firstCategory = Object.keys(categorizedArticles)[0];
if (firstCategory) expandedCategories.add(firstCategory);

const toggleCategory = (category) => {
  if (expandedCategories.has(category)) {
    expandedCategories.delete(category);
  } else {
    expandedCategories.add(category);
  }
};
</script>

<style scoped>
.home-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 50px;
}
.header-content h1 {
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 10px;
}
.header-content p {
  color: #64748b;
  font-size: 1.1rem;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1.5px solid #42b983;
  text-align: center;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.1);
}
.stat-num {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: #42b983;
}
.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}
.stat-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}
.all-vocab-btn {
  background: #42b983;
  color: white;
  text-decoration: none;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: bold;
}
.clear-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
}

/* ========== 分类标题 ========== */
.category-section {
  margin-bottom: 30px;
}
.category-title {
  font-size: 1.3rem;
  color: #1e293b;
  border-left: 4px solid #42b983;
  padding: 10px 16px;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
  border-radius: 0 8px 8px 0;
}
.category-title:hover {
  background: #f8fafc;
}

.tree-arrow {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  transition: transform 0.2s;
  color: #94a3b8;
  display: inline-block;
}
.tree-arrow.expanded {
  color: #42b983;
}
.category-count {
  font-size: 0.75rem;
  font-weight: 400;
  color: #94a3b8;
  margin-left: auto;
}

/* ========== 折叠动画 ========== */
.home-slide-enter-active,
.home-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.home-slide-enter-from,
.home-slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}
.home-slide-enter-to,
.home-slide-leave-from {
  max-height: 3000px;
  opacity: 1;
}

/* ========== 文章网格 ========== */
.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 10px;
}

.article-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
}
.article-card:hover {
  transform: translateY(-4px);
  border-color: #42b983;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.card-tag {
  background: #eefdf5;
  color: #42b983;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: bold;
  width: fit-content;
  margin-bottom: 12px;
}

.card-title {
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 8px;
  line-height: 1.4;
}
.card-subtitle {
  color: #64748b;
  font-size: 0.85rem;
  flex: 1;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #94a3b8;
}
.go-read {
  color: #42b983;
  font-weight: bold;
}

@media (max-width: 600px) {
  .home-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  .stat-card {
    width: 100%;
  }
  .article-grid {
    grid-template-columns: 1fr;
  }
}
</style>
