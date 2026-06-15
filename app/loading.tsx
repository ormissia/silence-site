/**
 * 首页 loading 骨架。app/page.tsx 是 force-dynamic，每次进首页都要等服务器
 * 拉作品 + 读书 + 高亮，慢网下视觉空窗最长。
 *
 * 内容：留出 hero 一屏黑底 + 阅读区一屏占位，结构与真实首页大致同尺寸，
 * 切换时不会大幅跳动。
 */
export default function HomeLoading() {
  return (
    <>
      {/* hero 区：电影序章一屏黑底 */}
      <section className="relative h-screen w-full bg-paper" aria-hidden />
      {/* 阅读区一屏占位，与真实首页大致同高 */}
      <section className="relative h-screen w-full bg-paper" aria-hidden />
    </>
  );
}
