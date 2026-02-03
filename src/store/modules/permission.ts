import type { RouteRecordRaw } from "vue-router";
import { constantRoutes } from "@/router";
import { store } from "@/store";
import router from "@/router";

import MenuAPI from "@/api/system/menu";
import { RouteItem } from "@/types";
import { routePerformance } from "@/utils/route-debugger";
const modules = import.meta.glob("../../views/**/**.vue");
const Layout = () => import("../../layouts/index.vue");

/**
 * 验证生成的路由配置
 */
function validateGeneratedRoutes(routes: RouteRecordRaw[]): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  function validateRoute(route: RouteRecordRaw, path: string = ""): void {
    // 检查必需字段
    if (!route.path) {
      issues.push(`Route at ${path} missing path`);
    }

    // 检查路径格式
    if (route.path && !route.path.startsWith("/") && path !== "") {
      issues.push(`Route ${path}${route.path} should start with '/'`);
    }

    // 检查组件
    if (route.component === undefined && (!route.children || route.children.length === 0)) {
      issues.push(`Route ${path}${route.path} has no component and no children`);
    }

    // 递归检查子路由
    if (route.children) {
      route.children.forEach((child, index) => {
        validateRoute(child, `${path}${route.path}/`);
      });
    }
  }

  routes.forEach((route) => validateRoute(route));

  return {
    isValid: issues.length === 0,
    issues,
  };
}

function resolveViewComponent(componentPath: string) {
  // 输入验证
  if (!componentPath || typeof componentPath !== "string") {
    console.warn(`Invalid component path: ${componentPath}`);
    return modules[`../../views/error/404.vue`];
  }

  const normalized = componentPath
    .trim()
    .replace(/^\/+/, "")
    .replace(/\.vue$/i, "")
    .replace(/[\\]+/g, "/"); // 统一路径分隔符

  // 构建可能的组件路径
  const possiblePaths = [
    `../../views/${normalized}.vue`,
    `../../views/${normalized}/index.vue`,
    // 尝试不同的路径格式
    `../../views/${normalized.replace(/\//g, "-")}.vue`,
    `../../views/${normalized.split("/").pop()}.vue`,
  ];

  // 查找存在的组件
  let component = null;
  let foundPath = "";

  for (const path of possiblePaths) {
    if (modules[path]) {
      component = modules[path];
      foundPath = path;
      break;
    }
  }

  // 如果没找到组件，记录详细信息并返回404
  if (!component) {
    console.warn(`Component not found for path: ${componentPath}`, {
      normalizedPath: normalized,
      attemptedPaths: possiblePaths,
      availableModules: Object.keys(modules).filter(
        (key) => key.includes(normalized) || key.includes(componentPath)
      ),
      timestamp: new Date().toISOString(),
    });

    // 返回404页面作为兜底
    return modules[`../../views/error/404.vue`];
  }

  // 返回原始组件（保持原有类型兼容性）
  // 错误处理将在LayoutMain.vue中进行
  return component;
}

export const usePermissionStore = defineStore("permission", () => {
  // 所有路由（静态路由 + 动态路由）
  const routes = ref<RouteRecordRaw[]>([]);
  // 混合布局的左侧菜单路由
  const mixLayoutSideMenus = ref<RouteRecordRaw[]>([]);
  // 动态路由是否已生成
  const isRouteGenerated = ref(false);

  /** 生成动态路由 */
  async function generateRoutes(): Promise<RouteRecordRaw[]> {
    const startTime = performance.now();
    routePerformance.startTiming("route-generation");

    try {
      console.log("开始生成动态路由...");

      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

      const data = await MenuAPI.getRoutes(); // 获取当前登录人的菜单路由
      clearTimeout(timeoutId);

      console.log("获取到菜单数据:", data.length, "条记录");

      // 数据验证
      if (!Array.isArray(data)) {
        throw new Error("Invalid menu data format");
      }

      // 过滤无效路由
      const validRoutes = data.filter((route) => {
        if (!route.path) {
          console.warn("Skipping route without path:", route);
          return false;
        }
        return true;
      });

      const dynamicRoutes = transformRoutes(validRoutes);

      console.log("转换后动态路由数量:", dynamicRoutes.length);

      // 验证生成的路由
      const routeValidation = validateGeneratedRoutes(dynamicRoutes);
      if (!routeValidation.isValid) {
        console.warn("路由验证发现问题:", routeValidation.issues);
      }

      routes.value = [...constantRoutes, ...dynamicRoutes];
      isRouteGenerated.value = true;

      console.log("动态路由生成完成，总路由数:", routes.value.length);

      // 记录性能数据
      const endTime = performance.now();
      const duration = endTime - startTime;
      routePerformance.measureRouteGeneration(duration);
      routePerformance.endTiming("route-generation");

      return dynamicRoutes;
    } catch (error) {
      console.error("动态路由生成失败:", error);
      routePerformance.endTiming("route-generation");

      // 路由生成失败，重置状态
      isRouteGenerated.value = false;

      // 提供最小化的路由作为兜底
      routes.value = [...constantRoutes];

      throw error;
    }
  }

  /** 设置混合布局左侧菜单 */
  const setMixLayoutSideMenus = (parentPath: string) => {
    const parentMenu = routes.value.find((item: RouteRecordRaw) => item.path === parentPath);
    mixLayoutSideMenus.value = parentMenu?.children || [];
  };

  /** 重置路由状态 */
  const resetRouter = () => {
    // 移除动态添加的路由
    const constantRouteNames = new Set(constantRoutes.map((route) => route.name).filter(Boolean));
    routes.value.forEach((route: RouteRecordRaw) => {
      if (route.name && !constantRouteNames.has(route.name)) {
        router.removeRoute(route.name);
      }
    });

    // 重置所有状态
    routes.value = [...constantRoutes];
    mixLayoutSideMenus.value = [];
    isRouteGenerated.value = false;
  };

  return {
    routes,
    mixLayoutSideMenus,
    isRouteGenerated,
    generateRoutes,
    setMixLayoutSideMenus,
    resetRouter,
  };
});

/**
 * 转换后端路由数据为Vue Router配置
 * 处理组件路径映射和Layout层级嵌套
 */
const transformRoutes = (routes: RouteItem[], isTopLevel: boolean = true): RouteRecordRaw[] => {
  return routes.map((route) => {
    const { component, children, ...args } = route;

    // 处理组件：顶层或非Layout保留组件，中间层Layout设为undefined
    const processedComponent = isTopLevel || component !== "Layout" ? component : undefined;

    const normalizedRoute = { ...args } as RouteRecordRaw;

    if (!processedComponent) {
      // 多级菜单的父级菜单，不需要组件
      normalizedRoute.component = undefined;
    } else {
      // 动态导入组件，Layout特殊处理，找不到组件时返回404
      normalizedRoute.component =
        processedComponent === "Layout" ? Layout : resolveViewComponent(processedComponent);
    }

    // 递归处理子路由
    if (children && children.length > 0) {
      normalizedRoute.children = transformRoutes(children, false);
    }

    return normalizedRoute;
  });
};

/** 非组件环境使用权限store */
export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
