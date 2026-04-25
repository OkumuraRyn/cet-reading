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

    <!-- 分类分栏展示 -->
    <section v-for="(articles, category) in categorizedArticles" :key="category" class="category-section">
      <h2 class="category-title">{{ category }}</h2>
      <div class="article-grid">
        <router-link
          v-for="art in articles"
          :key="art.id"
          :to="`/article/${art.id}`"
          class="article-card"
        >
          <div class="card-tag">{{ art.type }}</div>
          <h2 class="card-title">{{ art.title }}</h2>
          <p class="card-subtitle">{{ art.titleCn }}</p>
          <div class="card-footer">
            <span>{{ art.paragraphs.length }} 段落</span>
            <span class="go-read">开始阅读 →</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { categorizedArticles } from '../data/index';
import { studyStore } from '../store/studyStore';
</script>

<style scoped>
.home-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 50px;
}

.header-content h1 { font-size: 2.5rem; color: #1e293b; margin-bottom: 10px; }
.header-content p { color: #64748b; font-size: 1.1rem; }

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1.5px solid #42b983;
  text-align: center;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.1);
}

.stat-num { display: block; font-size: 2rem; font-weight: 800; color: #42b983; }
.stat-label { font-size: 0.85rem; color: #64748b; }

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
  background: none; border: none;
  color: #94a3b8; font-size: 0.75rem; cursor: pointer; text-decoration: underline;
}

/* 分类标题 */
.category-section {
  margin-bottom: 40px;
}

.category-title {
  font-size: 1.5rem;
  color: #1e293b;
  border-left: 4px solid #42b983;
  padding-left: 12px;
  margin-bottom: 20px;
}

/* 文章网格 */
.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.article-card {
  background: white;
  padding: 25px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.article-card:hover {
  transform: translateY(-5px);
  border-color: #42b983;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}

.card-tag {
  background: #eefdf5;
  color: #42b983;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: bold;
  width: fit-content;
  margin-bottom: 15px;
}

.card-title { font-size: 1.25rem; color: #1e293b; margin-bottom: 8px; line-height: 1.4; }
.card-subtitle { color: #64748b; font-size: 0.9rem; flex: 1; margin-bottom: 20px; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #94a3b8;
}

.go-read { color: #42b983; font-weight: bold; }

@media (max-width: 600px) {
  .home-header { flex-direction: column; align-items: flex-start; gap: 20px; }
  .stat-card { width: 100%; }
}
</style>