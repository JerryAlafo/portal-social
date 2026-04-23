"use client";

import styles from "../page.module.css";

interface ActivityChartProps {
  monthlyPosts: number[];
  monthlyLabels: string[];
}

export function ActivityChart({ monthlyPosts, monthlyLabels }: ActivityChartProps) {
  const maxPosts = Math.max(...monthlyPosts, 1);
  
  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>Publicações (30 dias)</div>
      <div className={styles.barChart}>
        {monthlyPosts.map((posts, i) => (
          <div key={i} className={styles.barWrapper}>
            <div 
              className={styles.chartBar} 
              style={{ height: `${(posts / maxPosts) * 100}%` }}
              title={`${posts} publicações`}
            />
            <span className={styles.barLabel}>{monthlyLabels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CategoryBarsProps {
  data: { name: string; value: number }[];
}

export function CategoryBars({ data }: CategoryBarsProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>Por Categoria</div>
      <div className={styles.categoryBars}>
        {data.map((item, i) => (
          <div key={i} className={styles.categoryRow}>
            <span className={styles.categoryName}>{item.name}</span>
            <div className={styles.categoryBarBg}>
              <div 
                className={styles.categoryBar} 
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className={styles.categoryValue}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}