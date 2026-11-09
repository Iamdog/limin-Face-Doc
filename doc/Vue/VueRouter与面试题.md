---
title: VueRouter底层路由与权限守卫深度实战
---

# VueRouter底层路由与权限守卫深度实战

## 🎯 招聘面试核心考点
- **面试官设问**：“`createWebHashHistory` (Hash 模式) 与 `createWebHistory` (HTML5 History 模式) 的**底层通信与事件监听机制**有何区别？”
- **深水区追问**：“为什么生产环境使用 History 模式打包部署后，**一按浏览器 F5 刷新就会出现 Nginx 404 Not Found**？后台管理系统中基于 RBAC 角色的**动态路由（`router.addRoute`）**是如何落地的？全局前置守卫 `beforeEach` 中最容易出现的**死循环卡死白屏**该如何彻底规避？”

---

## 一、 路由模式底层机制对比：Hash vs History

### 1. Hash 模式（`createWebHashHistory`）
- **URL 特征**：包含 `#` 符号，如 `https://example.com/#/user/profile`。
- **底层原理**：
  - `#` 后面的字符被称为 URL 的 Hash 片段，**它不会包含在发送给服务端的 HTTP 请求中**（即服务端接收到的永远只有 `https://example.com/`）。
  - 浏览器通过监听 **`window.onhashchange`** 事件捕获 URL 变化，前端路由根据哈希值切换不同组件。
- **优缺点**：兼容性极好，部署在任意静态托管服务器均可直接运行，不需要后端任何额外配置；缺点是 URL 不美观，某些三方 OAuth 回调与支付接口会吞噬 `#`。

---

### 2. HTML5 History 模式（`createWebHistory`）
- **URL 特征**：标准优雅的自然路径，如 `https://example.com/user/profile`。
- **底层原理**：
  - 基于 HTML5 History API 提供的 **`history.pushState()`** 与 **`history.replaceState()`**。
  - 这两个 API 可以在**修改浏览器地址栏 URL 的同时，绝对不向后端发起新的 HTTP 请求**！
  - 当用户点击浏览器的【前进】或【后退】按钮时，触发 **`window.onpopstate`** 事件完成视图同步。

---

## 二、 生产排错：History 模式部署 Nginx 刷新 404 事故

### 1. 事故根因
在 SPA（单页面应用）中，服务器根目录下**其实只有一个 `index.html` 实体文件**，根本不存在 `/user/profile` 这个真实的物理目录或文件。
- 初次访问 `https://example.com/`，Nginx 正常返回 `index.html`，随后由前端路由根据代码渲染 `/user/profile`，一切正常。
- 但如果用户在当前页面直接按下 **F5 刷新**：浏览器会直接向 Nginx 发起真实的 HTTP GET 请求：`GET /user/profile`。
- Nginx 在服务器文件系统找不到 `/user/profile` 目录，直接返回 **404 Not Found**！

### 2. 生产级 Nginx 配置修复方案
通过配置 **`try_files`**：先尝试寻找真实物理文件，找不到则统一重定向返回根目录的 `index.html`，把路由解析权还给 Vue：

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        
        # 核心：依次尝试 $uri (文件) -> $uri/ (目录) -> 兜底重定向到 /index.html
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 三、 企业级实战：动态路由挂载（RBAC 权限）与死循环避坑

### 1. 守卫死循环的自杀写法与排查
- **错误写法（死循环卡死）**：
  ```javascript
  router.beforeEach((to, from, next) => {
    const token = getToken();
    if (!token) {
      next('/login'); // 致命错误：这会再次触发 beforeEach，然后再次进入 next('/login')，死循环崩溃！
    } else {
      next();
    }
  });
  ```
- **正确写法**：必须加上白名单出口校验：`if (to.path === '/login') next(); else next('/login');`

---

### 2. 动态路由添加完整 MVP 最佳范式

```javascript
// router/permission.js
import router from './index';
import { useUserStore } from '@/stores/user';

const whiteList = ['/login', '/404']; // 白名单路由无需登录

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const hasToken = userStore.token;

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' }); // 已登录仍访问登录页，重定向至首页
    } else {
      // 判断是否已经拉取过用户权限路由
      const hasRoles = userStore.roles && userStore.roles.length > 0;
      if (hasRoles) {
        next(); // 权限已就绪，放行
      } else {
        try {
          // 1. 异步请求用户权限角色列表 (如 ['admin'])
          const { roles } = await userStore.getUserInfo();

          // 2. 根据角色动态过滤出该用户可访问的异步路由表
          const accessRoutes = await userStore.generateRoutes(roles);

          // 3. 动态注入路由核心 API: router.addRoute
          accessRoutes.forEach((route) => {
            router.addRoute(route);
          });

          // 核心注意：replace: true 保证动态添加完路由后再重新触发一次跳转，防白屏！
          next({ ...to, replace: true });
        } catch (error) {
          // 异常情况清理 Token 并跳转至登录页
          await userStore.resetToken();
          next(`/login?redirect=${to.path}`);
        }
      }
    }
  } else {
    // 未登录场景
    if (whiteList.includes(to.path)) {
      next(); // 在白名单中，放行
    } else {
      next(`/login?redirect=${to.path}`); // 携带原访问路径以便登录后回跳
    }
  }
});
```
