import { sasHttp } from "@/utils/request";

// ============================================
// SAS 系统管理服务接口
// ============================================

/**
 * 获取 Token（从 localStorage 读取）
 */
function getToken() {
  const json = JSON.parse(localStorage.getItem("application-cloud-user") || "{}");
  return json.token;
}

/**
 * 获取带 Token 的请求头
 */
function getAuthHeaders() {
  return {
    "X-Ca-Token": getToken(),
  };
}

const SasAPI = {
  /**
   * 示例：获取系统配置
   */
  getSystemConfig() {
    return sasHttp({
      url: "/sas/system/config",
      method: "get",
      headers: getAuthHeaders(),
    });
  },

  /**
   * 示例：更新系统配置
   * @param data 配置数据
   */
  updateSystemConfig(data: any) {
    return sasHttp({
      url: "/sas/system/config",
      method: "put",
      headers: getAuthHeaders(),
      data,
    });
  },

  /**
   * 示例：获取列表数据
   * @param params 查询参数
   */
  getList(params?: any) {
    return sasHttp({
      url: "/sas/list",
      method: "get",
      headers: getAuthHeaders(),
      params,
    });
  },

  /**
   * 示例：创建数据
   * @param data 数据
   */
  create(data: any) {
    return sasHttp({
      url: "/sas/create",
      method: "post",
      headers: getAuthHeaders(),
      data,
    });
  },

  /**
   * 示例：更新数据
   * @param id 数据ID
   * @param data 数据
   */
  update(id: string | number, data: any) {
    return sasHttp({
      url: `/sas/update/${id}`,
      method: "put",
      headers: getAuthHeaders(),
      data,
    });
  },

  /**
   * 示例：删除数据
   * @param id 数据ID
   */
  delete(id: string | number) {
    return sasHttp({
      url: `/sas/delete/${id}`,
      method: "delete",
      headers: getAuthHeaders(),
    });
  },
};

export default SasAPI;
