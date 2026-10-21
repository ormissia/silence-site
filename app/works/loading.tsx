import { PagePlate } from "@/components/layout/page-plate";
import { CollectionLoading } from "@/components/layout/page-loading";

/**
 * Works 列表 loading 骨架。OSS list 第一次冷启动 + image-meta 探测可能要几百 ms，
 * 空窗明显。图版即时出现，下方复用 Gallery 的加载骨架。
 */
export default function WorksLoading() {
  return (
    <>
      <PagePlate label="Works" title="光的片段" lede="风光、日常与胶片，按系列归档。每一组都是一次出门。" />
      <section className="page-frame pb-20">
        <CollectionLoading />
      </section>
    </>
  );
}
