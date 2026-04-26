/* src/data/index.js — 动态导入版 */

// 使用 Vite 的 glob 导入所有文章模块
const articleModules = import.meta.glob('./articles/**/*.js', { eager: true });

// 构建分类数据
const rawArticles = Object.entries(articleModules).map(([path, mod]) => {
  const article = mod.default;
  // 从路径推断分类
  if (path.includes('/cet4/')) return { ...article, _category: 'CET-4 四级核心阅读' };
  if (path.includes('/the-everest-story/')) return { ...article, _category: '六级扩展 · The Everest Story' };
  if (path.includes('/cet6/')) return { ...article, _category: 'CET-6 六级深度阅读' };
  if (path.includes('/zsb/')) return { ...article, _category: '专升本阅读' };
  return null;
}).filter(Boolean);

// 按分类分组
export const categorizedArticles = {};
rawArticles.forEach(art => {
  if (!categorizedArticles[art._category]) {
    categorizedArticles[art._category] = [];
  }
  const { _category, ...article } = art;
  categorizedArticles[_category].push(article);
});

// 扁平化数组
export const allArticles = Object.values(categorizedArticles).flat();
