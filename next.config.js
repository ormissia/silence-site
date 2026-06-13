/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // OSS 自带 x-oss-process（resize/format/quality）在做同样的事，
    // next/image 优化器再包一层只会触发 403（防盗链）+ 多一跳代理。
    // 关掉优化器，让 <Image> 直接输出 OSS URL。
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "ormissia-album.oss-cn-beijing.aliyuncs.com" },
    ],
  },
};

module.exports = nextConfig;
