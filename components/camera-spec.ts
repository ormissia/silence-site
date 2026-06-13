/**
 * 相机外形与 LCD 槽位规格。
 *
 * 换新相机图片时，只改这一处即可——CinemaHero 会自动按 LCD 中心计算 transform-origin。
 *
 * 如何测量新相机的 LCD 坐标：
 *   1. 临时把 .env.local 加 NEXT_PUBLIC_DEBUG_LCD=1（或 URL 拼 ?debugLcd=1）
 *   2. 刷新首页，LCD 槽位会用红色描边显示
 *   3. 拿屏幕标尺工具量出 LCD 矩形相对相机外形矩形的边距比例
 *   4. 改下面的 lcd 四个百分比，刷新核对
 *
 * 所有百分比相对相机外形容器（aspect = naturalWidth / naturalHeight）。
 */
export type CameraSpec = {
  src: string;
  /** 相机原图长宽比，用于容器 aspect-ratio。把它写对，宽度才会等比例换算 */
  aspect: number;
  lcd: {
    /** LCD 左上角到相机左边的距离 */
    left: string;
    /** LCD 左上角到相机顶部的距离 */
    top: string;
    /** LCD 宽度 */
    width: string;
    /** LCD 高度 */
    height: string;
  };
};

/** 当前使用的相机：Sony α 系列背面（public/images/camera.png 1000×691） */
export const CAMERA: CameraSpec = {
  src: "/images/camera.png",
  aspect: 1000 / 691,
  lcd: {
    left: "13%",
    top: "41%",
    width: "49%",
    height: "49%",
  },
};

/** 由 lcd 矩形派生 transform-origin（"x% y%"），让 scale 时 LCD 中心对准固定锚点 */
export function lcdCenter(spec: CameraSpec = CAMERA): string {
  const cx = parseFloat(spec.lcd.left) + parseFloat(spec.lcd.width) / 2;
  const cy = parseFloat(spec.lcd.top) + parseFloat(spec.lcd.height) / 2;
  return `${cx}% ${cy}%`;
}
