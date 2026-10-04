/** 列表卡片和首页精选使用的作品摘要。 */
export type WorkSummary = {
  slug: string;
  title: string;
  series: string;
  date: string;
  location: string;
  cover: string;
  deck: string;
};

export type Photo = {
  key: string;
  caption?: string;
  /** OSS 探测得到的真实像素尺寸，详情相册用于排版。 */
  width?: number;
  height?: number;
};

export type WorkDetail = WorkSummary & {
  coverWidth?: number;
  coverHeight?: number;
  story: string[];
  exif: { camera: string; lens: string; film?: string };
  photos: Photo[];
  featured?: boolean;
};

/** 兼容现有完整作品查询接口。 */
export type Work = WorkDetail;
