/* src/data/index.js */
// 1. 导入四级文章
import cet4_a1 from './articles/cet4/a1.js';
import cet4_a2 from './articles/cet4/a2.js';
import cet4_a3 from './articles/cet4/a3.js';
import cet4_a4 from './articles/cet4/a4.js';
import cet4_a5 from './articles/cet4/a5.js';
import cet4_a6 from './articles/cet4/a6.js';
import cet4_a7 from './articles/cet4/a7.js';


// 2. 导入六级文章
import cet6_a1 from './articles/cet6/a1.js';
import cet6_a2 from './articles/cet6/a2.js';
import cet6_a3 from './articles/cet6/a3.js';
import cet6_a4 from './articles/cet6/a4.js';
import cet6_a5 from './articles/cet6/a5.js';
import cet6_a6 from './articles/cet6/a6.js';


// 3. 导入zsb文章
import zsb_a1 from './articles/zsb/a1.js';
import zsb_a2 from './articles/zsb/a2.js';
import zsb_a3 from './articles/zsb/a3.js';

// 4. 导出分类数据 (侧边栏使用)
export const categorizedArticles = {
  "CET-4 四级核心阅读": [
    cet4_a1,
    cet4_a2,
    cet4_a3,
    cet4_a4,
    cet4_a5,
    cet4_a6,
    cet4_a7,
  ],
  "CET-6 六级深度阅读": [
    cet6_a1, 
    cet6_a2,
    cet6_a3,
    cet6_a4,
    cet6_a5,
    cet6_a6,

  ],
  "专升本阅读": [
    zsb_a1, 
    zsb_a2, 
    zsb_a3,
  ]
};

// 5. 导出扁平化数组 (详情页查找使用)
export const allArticles = Object.values(categorizedArticles).flat();
