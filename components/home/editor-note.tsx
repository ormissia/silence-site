export function EditorNote() {
  return (
    <div className="mx-auto mt-32 max-w-[1400px] px-6 md:px-10">
      <div className="grid grid-cols-12 gap-6 border-t border-rule pt-12">
        <p className="eyebrow col-span-12 md:col-span-3">Editor&rsquo;s Note</p>
        <div className="col-span-12 md:col-span-9">
          <p className="drop-cap max-w-column font-sans text-lede leading-relaxed">
            这是一本关于光与等待的小册子。每一组照片都来自一段不太喧闹的旅程——<br/>
            繁华都市，高原雪山，山中密林。<br/>
            我把它们以一种慢一点的方式排版，希望你也愿意慢一点看。<br/>

          </p>
          <p className="mt-8 font-sans text-label uppercase tracking-[0.18em] text-muted">
            — Silence, Editor
          </p>
        </div>
      </div>
    </div>
  );
}
