/**
 * 微服务使用示例
 *
 * 本文件展示如何在不同场景下使用微服务 HTTP 实例
 */

import request from "@/utils/request"; // 默认服务（通用接口）
import { ssoHttp, sasHttp } from "@/utils/request"; // 微服务实例

// ============================================
// 示例 1: 使用默认服务（通用接口）
// ============================================

export const DefaultServiceExample = {
  /** 获取数据 - 使用默认服务 */
  getData() {
    return request({
      url: "/api/v1/data",
      method: "get",
    });
  },
};

// ============================================
// 示例 2: 使用 SSO 单点登录服务
// ============================================

export const SSOServiceExample = {
  /** SSO 登录 - 请求将发送到 SSO 服务 */
  login(data: { username: string; password: string }) {
    return ssoHttp({
      url: "/sso/login", // 实际请求: /api/sso/login
      method: "post",
      data,
    });
  },

  /** SSO 用户信息 */
  getUserInfo() {
    return ssoHttp({
      url: "/sso/user/info",
      method: "get",
    });
  },
};

// ============================================
// 示例 3: 使用 SAS 系统管理服务
// ============================================

export const SASServiceExample = {
  /** 获取系统配置 - 请求将发送到 SAS 服务 */
  getSystemConfig() {
    return sasHttp({
      url: "/sas/system/config", // 实际请求: /api/sas/system/config
      method: "get",
    });
  },

  /** 更新系统配置 */
  updateSystemConfig(data: any) {
    return sasHttp({
      url: "/sas/system/config",
      method: "put",
      data,
    });
  },
};

// ============================================
// 使用说明
// ============================================

/**
 * 1. 默认服务 (request)
 *    - 适用于通用接口调用
 *    - 代理路径: /dev-api
 *    - 目标地址: VITE_APP_API_URL
 *
 * 2. SSO 服务 (ssoHttp)
 *    - 适用于单点登录相关接口
 *    - 代理路径: /api/sso
 *    - 目标地址: VITE_APP_SSO_API_URL
 *
 * 3. SAS 服务 (sasHttp)
 *    - 适用于系统管理相关接口
 *    - 代理路径: /api/sas
 *    - 目标地址: VITE_APP_SAS_API_URL
 *
 * 代理转发示例:
 * - 请求: ssoHttp({ url: "/sso/getCaptcha" })
 * - 完整路径: /api/sso/getCaptcha
 * - 转发: http://192.168.80.203:19999/sso/getCaptcha
 *
 * 环境配置 (.env.localhost):
 * VITE_APP_API_URL=http://192.168.80.203:19999
 * VITE_APP_SSO_API_URL=http://192.168.80.203:19999/sso
 * VITE_APP_SAS_API_URL=http://192.168.80.203:19999/sas
 */
