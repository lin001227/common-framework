import type { RouteRecordRaw } from "vue-router";
import NProgress from "@/plugins/nprogress";
import router from "@/router";
import { usePermissionStore, useUserStore } from "@/store";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { isTenantEnabled } from "@/utils/tenant";
import { debugRoute, debugUnmatchedRoute, routePerformance } from "@/utils/route-debugger";

/**
 * 路由权限守卫
 *
 * 处理登录验证、动态路由生成、404检测等
 */
export function setupPermissionGuard() {
  const whiteList = ["/login"];

  router.beforeEach(async (to, _from, next) => {
    NProgress.start();

    try {
      const isLoggedIn = useUserStore().isLoggedIn();

      // 未登录处理
      if (!isLoggedIn) {
        if (whiteList.includes(to.path)) {
          next();
        } else {
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
          NProgress.done();
        }
        return;
      }

      // 已登录访问登录页，重定向到首页
      if (to.path === "/login") {
        next({ path: "/" });
        return;
      }

      const permissionStore = usePermissionStore();
      const userStore = useUserStore();

      // 动态路由生成
      if (!permissionStore.isRouteGenerated) {
        if (!userStore.userInfo?.roles?.length) {
          await userStore.getUserInfo();
        }

        // 加载用户租户列表（VITE_APP_TENANT_ENABLED=true 时生效）
        await initTenantContext();

        const dynamicRoutes = await permissionStore.generateRoutes();
        dynamicRoutes.forEach((route: RouteRecordRaw) => {
          router.addRoute(route);
        });

        next({ ...to, replace: true });
        return;
      }

      // 路由匹配检查 - 改进的404检测逻辑
      if (to.matched.length === 0) {
        // 使用调试工具记录未匹配的路由
        debugUnmatchedRoute(to);

        // 对于某些特殊情况，尝试重新生成路由
        if (!permissionStore.isRouteGenerated) {
          console.log("Dynamic routes not generated yet, attempting regeneration...");
          try {
            const dynamicRoutes = await permissionStore.generateRoutes();
            dynamicRoutes.forEach((route: RouteRecordRaw) => {
              router.addRoute(route);
            });
            // 重新检查路由匹配
            const resolvedRoute = router.resolve(to);
            if (resolvedRoute.matched.length > 0) {
              next({ ...to, replace: true });
              return;
            }
          } catch (regenError) {
            console.error("Failed to regenerate routes:", regenError);
          }
        }

        // 最终兜底：对于API相关的路径，可能需要特殊处理
        if (to.path.startsWith("/api/") || to.path.includes("favicon")) {
          console.log("Ignoring API/favicon route:", to.path);
          next();
          return;
        }

        // 真正的404情况
        next("/404");
        return;
      } else {
        // 路由匹配成功，记录调试信息
        debugRoute(to);
      }

      // 动态标题
      const title = (to.params.title as string) || (to.query.title as string);
      if (title) {
        to.meta.title = title;
      }

      next();
    } catch (error) {
      console.error("Route guard error:", error);
      await useUserStore().resetAllState();
      next("/login");
      NProgress.done();
    }
  });

  router.afterEach(() => {
    NProgress.done();
  });
}

// ============================================
// 多租户支持（可选）
// ============================================

/** 初始化多租户上下文，未启用或失败时静默跳过 */
async function initTenantContext(): Promise<void> {
  // 多租户关闭时不初始化租户上下文
  if (!isTenantEnabled()) return;

  try {
    await useTenantStoreHook().loadTenant();
  } catch {
    // 静默失败，不影响主流程
  }
}
