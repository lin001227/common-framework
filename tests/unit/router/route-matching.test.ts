import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRouter, createWebHashHistory } from "vue-router";
import { routeDebugger, debugRoute, debugUnmatchedRoute } from "@/utils/route-debugger";

describe("路由匹配优化测试", () => {
  beforeEach(() => {
    // 清空调试日志
    routeDebugger.clearLogs();
  });

  describe("路由调试工具", () => {
    it("应该能够记录匹配的路由", () => {
      const mockRoute = {
        path: "/test",
        fullPath: "/test",
        matched: [{ path: "/test" }],
        query: {},
        params: {},
        meta: {},
      } as any;

      debugRoute(mockRoute);

      const logs = routeDebugger.getDebugLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].path).toBe("/test");
      expect(logs[0].componentInfo.exists).toBe(true);
    });

    it("应该能够记录未匹配的路由", () => {
      const mockRoute = {
        path: "/nonexistent",
        fullPath: "/nonexistent",
        matched: [],
        query: {},
        params: {},
        meta: {},
      } as any;

      debugUnmatchedRoute(mockRoute);

      const logs = routeDebugger.getDebugLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].path).toBe("/nonexistent");
      expect(logs[0].componentInfo.exists).toBe(false);
    });

    it("应该能够获取路由统计信息", () => {
      // 添加一些测试数据
      const matchedRoute = {
        path: "/matched",
        fullPath: "/matched",
        matched: [{ path: "/matched" }],
        query: {},
        params: {},
        meta: {},
      } as any;

      const unmatchedRoute = {
        path: "/unmatched",
        fullPath: "/unmatched",
        matched: [],
        query: {},
        params: {},
        meta: {},
      } as any;

      debugRoute(matchedRoute);
      debugUnmatchedRoute(unmatchedRoute);

      const stats = routeDebugger.getRouteStatistics();
      expect(stats.totalRequests).toBe(2);
      expect(stats.matchedRoutes).toBe(1);
      expect(stats.unmatchedRoutes).toBe(1);
    });
  });

  describe("路由配置验证", () => {
    it("应该验证有效的路由配置", async () => {
      // 这里可以测试我们添加的路由验证逻辑
      const { validateGeneratedRoutes } = await import("@/store/modules/permission");

      const validRoutes = [
        {
          path: "/dashboard",
          component: () => Promise.resolve({}),
          meta: { title: "仪表板" },
        },
      ];

      const result = validateGeneratedRoutes(validRoutes as any);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("应该检测无效的路由配置", async () => {
      const { validateGeneratedRoutes } = await import("@/store/modules/permission");

      const invalidRoutes = [
        {
          // 缺少 path 字段
          component: () => Promise.resolve({}),
          meta: { title: "无效路由" },
        },
      ];

      const result = validateGeneratedRoutes(invalidRoutes as any);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Route at  missing path");
    });
  });
});
