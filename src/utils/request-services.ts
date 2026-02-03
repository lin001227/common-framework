import { getServiceInstance, type ServiceConfig } from "./request-factory";

// ============================================
// 微服务配置定义
// ============================================

/** 默认服务（通用接口） */
const defaultServiceConfig: ServiceConfig = {
  name: "default",
  baseURL: "/api",
};

/** SSO 单点登录服务 */
const ssoServiceConfig: ServiceConfig = {
  name: "sso",
  baseURL: "/api",
};

/** SAS 系统管理服务 */
const sasServiceConfig: ServiceConfig = {
  name: "sas",
  baseURL: "/api",
};

// ============================================
// 微服务实例导出
// ============================================

/** 默认 HTTP 请求实例（向后兼容原有代码） */
const http = getServiceInstance(defaultServiceConfig);

/** SSO 服务请求实例 */
export const ssoHttp = getServiceInstance(ssoServiceConfig);

/** SAS 服务请求实例 */
export const sasHttp = getServiceInstance(sasServiceConfig);

/** 默认导出（向后兼容） */
export default http;

// ============================================
// 微服务实例获取工具
// ============================================

/**
 * 根据服务名称获取请求实例
 * @param serviceName 服务名称
 * @returns HTTP 请求实例
 */
export function getHttpByService(serviceName: "default" | "sso" | "sas") {
  const configMap = {
    default: defaultServiceConfig,
    sso: ssoServiceConfig,
    sas: sasServiceConfig,
  };

  const config = configMap[serviceName];
  if (!config) {
    console.warn(`Unknown service: ${serviceName}, using default service`);
    return http;
  }

  return getServiceInstance(config);
}
