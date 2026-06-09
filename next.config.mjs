/** @type {import('next').NextConfig} */
const nextConfig = {
  // スマホなど別端末から Network URL (133.14.210.106:3000) で開くときに HMR を許可
  allowedDevOrigins: ["133.14.210.106"],
};

export default nextConfig;
