/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.reddit.com"
      },
      {
        protocol: "https",
        hostname: "i.redd.it"
      },
      {
        protocol: "https",
        hostname: "preview.redd.it"
      },
      {
        protocol: "https",
        hostname: "**.hnrss.org"
      },
      {
        protocol: "https",
        hostname: "**.githubusercontent.com"
      }
    ]
  }
};

module.exports = nextConfig;

