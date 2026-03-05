import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Face-Doc",
  description: "A VitePress Site",
  base: "/limin-Face-Doc/", // 必须和你的 GitHub 仓库名一致，且前后都有斜杠
  themeConfig: {
    search: {
      provider: "local",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "快速开始", link: "/doc/前言" },
      { text: "技术栈", link: "/doc/Android/RecyclerView" },
    ],

    sidebar: [
      {
        text: "技术栈",
        items: [
          {
            text: "前言",
            link: "/doc/前言",
          },
          {
            text: "Android",
            link: "/doc/Android/前言",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/Android/前言" },
              { text: "Activity", link: "/doc/Android/四大组件之Activity" },
              { text: "Fragment", link: "/doc/Android/四大组件之Fragment" },
              { text: "Service", link: "/doc/Android/四大组件之Service" },
              { text: "BroadcastReceiver", link: "/doc/Android/四大组件之BroadcastReceiver" },
              { text: "ContentProvider", link: "/doc/Android/四大组件之ContentProvider" },
              { text: "UI布局方式", link: "/doc/Android/布局方式" },
              { text: "RecyclerView", link: "/doc/Android/RecyclerView" },
            ],
          },
          {
            text: "Vue",
            link: "/doc/Vue/前言",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/Vue/前言" },
              { text: "v-model的原理", link: "/doc/Vue/v-model的原理" },
            ],
          },
          { text: "浙政钉", link: "/doc/浙政钉/浙政钉开发上架流程" ,
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/浙政钉/前言" },
              { text: "开发上架流程", link: "/doc/浙政钉/浙政钉开发上架流程" },
            ],
          },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present Li Min",
    },
  },
  lastUpdated: true,
});
