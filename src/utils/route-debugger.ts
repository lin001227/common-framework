/**
 * 路由调试和监控工具
 * 用于追踪路由匹配问题和性能分析
 */

import type { RouteRecordRaw, RouteLocationNormalized } from "vue-router";

interface RouteDebugInfo {
  timestamp: string;
  path: string;
  fullPath: string;
  matchedRoutes: string[];
  componentInfo: {
    name?: string;
    path?: string;
    exists: boolean;
  };
  metadata: Record<string, any>;
}

class RouteDebugger {
  private debugLogs: RouteDebugInfo[] = [];
  private readonly MAX_LOGS = 100;

  /**
   * 记录路由匹配信息
   */
  logRouteMatch(route: RouteLocationNormalized, matchedRoutes: RouteRecordRaw[]) {
    const debugInfo: RouteDebugInfo = {
      timestamp: new Date().toISOString(),
      path: route.path,
      fullPath: route.fullPath,
      matchedRoutes: matchedRoutes.map((r) => r.path || ""),
      componentInfo: {
        name: route.name as string,
        path: route.path,
        exists: matchedRoutes.length > 0,
      },
      metadata: {
        query: route.query,
        params: route.params,
        meta: route.meta,
      },
    };

    this.debugLogs.push(debugInfo);

    // 限制日志数量
    if (this.debugLogs.length > this.MAX_LOGS) {
      this.debugLogs.shift();
    }

    // 开发环境下输出详细信息
    if (process.env.NODE_ENV === "development") {
      console.group(`[Route Debugger] ${route.path}`);
      console.log("Full Path:", route.fullPath);
      console.log(
        "Matched Routes:",
        matchedRoutes.map((r) => r.path)
      );
      console.log("Query Params:", route.query);
      console.log("Route Params:", route.params);
      console.log("Meta:", route.meta);
      console.groupEnd();
    }
  }

  /**
   * 记录路由未匹配情况
   */
  logUnmatchedRoute(route: RouteLocationNormalized) {
    console.warn("[Route Debugger] Unmatched route detected:", {
      path: route.path,
      fullPath: route.fullPath,
      query: route.query,
      params: route.params,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 获取调试日志
   */
  getDebugLogs(): RouteDebugInfo[] {
    return [...this.debugLogs];
  }

  /**
   * 清空调试日志
   */
  clearLogs(): void {
    this.debugLogs = [];
  }

  /**
   * 分析路由匹配统计
   */
  getRouteStatistics() {
    const stats = {
      totalRequests: this.debugLogs.length,
      matchedRoutes: 0,
      unmatchedRoutes: 0,
      mostAccessedPaths: {} as Record<string, number>,
      errorRoutes: 0,
    };

    this.debugLogs.forEach((log) => {
      if (log.componentInfo.exists) {
        stats.matchedRoutes++;
      } else {
        stats.unmatchedRoutes++;
      }

      // 统计路径访问频率
      const path = log.path;
      stats.mostAccessedPaths[path] = (stats.mostAccessedPaths[path] || 0) + 1;
    });

    return stats;
  }

  /**
   * 导出调试信息
   */
  exportDebugInfo(): string {
    return JSON.stringify(
      {
        logs: this.debugLogs,
        statistics: this.getRouteStatistics(),
        exportTime: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

// 创建全局实例
export const routeDebugger = new RouteDebugger();

// Vue Router 插件形式的调试器
export function createRouteDebuggerPlugin() {
  return {
    install(app: any) {
      // 可以在这里添加全局属性或方法
      app.config.globalProperties.$routeDebugger = routeDebugger;
    },
  };
}

// 路由性能监控
class RoutePerformanceMonitor {
  private timings: Map<string, number> = new Map();

  startTiming(key: string) {
    this.timings.set(key, performance.now());
  }

  endTiming(key: string): number | null {
    const startTime = this.timings.get(key);
    if (startTime === undefined) return null;

    const duration = performance.now() - startTime;
    this.timings.delete(key);

    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${key}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measureRouteGeneration(duration: number) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] Route generation took: ${duration.toFixed(2)}ms`);
    }
  }
}

export const routePerformance = new RoutePerformanceMonitor();

// 便捷的调试函数
export function debugRoute(route: RouteLocationNormalized) {
  routeDebugger.logRouteMatch(route, route.matched);
}

export function debugUnmatchedRoute(route: RouteLocationNormalized) {
  routeDebugger.logUnmatchedRoute(route);
}
