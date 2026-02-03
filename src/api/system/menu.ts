import request from "@/utils/request";
import { ssoHttp } from "@/utils/request-services";
import { AuthStorage } from "@/utils/auth";
import type {
  MenuQueryParams,
  MenuItem,
  MenuForm,
  RouteItem,
  OptionItem,
  BackendMenuItem,
} from "@/types/api";

const MENU_BASE_URL = "/api/v1/menus";

/**
 * 获取带 Token 的请求头
 */
function getAuthHeaders() {
  const token = AuthStorage.getAccessToken();
  return {
    "X-Ca-Token": token,
  };
}

/**
 * 将后端菜单结构转换为前端路由结构
 */
function transformBackendMenuToRoute(backendMenu: BackendMenuItem): RouteItem {
  const route: RouteItem = {
    path: backendMenu.routingAddress || "/",
    name: backendMenu.menuCode,
    component: backendMenu.type === 0 ? "Layout" : backendMenu.routingAddress,
    meta: {
      title: backendMenu.menuName,
      icon: backendMenu.icon,
      hidden: backendMenu.showValues === 1,
      keepAlive: true,
    },
    children: [],
  };

  // 递归转换子菜单
  if (backendMenu.children && backendMenu.children.length > 0) {
    route.children = backendMenu.children.map(transformBackendMenuToRoute);
  }

  return route;
}

const MenuAPI = {
  /** 获取当前用户的路由列表 - 使用 SSO 服务 */
  async getRoutes(): Promise<RouteItem[]> {
    const backendMenus = await ssoHttp<any, BackendMenuItem[]>({
      url: "/sso/getMenuMessageList",
      method: "post",
      data: {
        modularityAddress: "/sas/saspassport",
      },
      headers: getAuthHeaders(),
    });

    // 转换为前端路由结构
    return backendMenus.map(transformBackendMenuToRoute);
  },
  /** 获取菜单树形列表 */
  getList(queryParams: MenuQueryParams) {
    return request<any, MenuItem[]>({
      url: `${MENU_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },
  /** 获取菜单下拉数据源 */
  getOptions(onlyParent?: boolean, scope?: number) {
    return request<any, OptionItem[]>({
      url: `${MENU_BASE_URL}/options`,
      method: "get",
      params: { onlyParent, scope },
    });
  },
  /** 获取菜单表单数据 */
  getFormData(id: string) {
    return request<any, MenuForm>({ url: `${MENU_BASE_URL}/${id}/form`, method: "get" });
  },
  /** 新增菜单 */
  create(data: MenuForm) {
    return request({ url: `${MENU_BASE_URL}`, method: "post", data });
  },
  /** 修改菜单 */
  update(id: string, data: MenuForm) {
    return request({ url: `${MENU_BASE_URL}/${id}`, method: "put", data });
  },
  /** 删除菜单 */
  deleteById(id: string) {
    return request({ url: `${MENU_BASE_URL}/${id}`, method: "delete" });
  },
};

export default MenuAPI;
