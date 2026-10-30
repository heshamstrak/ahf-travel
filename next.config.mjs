/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "thumb.wikimedia.org" },
      // Milestone 7: admin-uploaded catalogue images, served by the real backend (Milestone 6).
      { protocol: "http", hostname: "localhost", port: "4000" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000" },
    ],
  },
  // Hostinger Managed Node.js Hosting's glibc is too old for the prebuilt native
  // @next/swc-linux-x64-gnu binary, and the -musl fallback fails to load there too. Forcing the
  // WASM SWC bindings (see @next/swc-wasm-nodejs in dependencies) sidesteps both native binaries
  // entirely — WASM has no glibc/ELF dependency on the host at all.
  experimental: {
    useWasmBinary: true,
  },
};

export default nextConfig;
