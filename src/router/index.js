import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ArticleView from '../views/ArticleView.vue';
import AllVocabView from '../views/AllVocabView.vue';
import MemorizeView from '../views/MemorizeView.vue';   // ✅ 新增

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/article/:id', component: ArticleView },
    { path: '/all-vocabulary', component: AllVocabView },
    { path: '/memorize', component: MemorizeView }      // ✅ 新增
  ]
});

export default router;