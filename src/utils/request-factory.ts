import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import qs from "qs";
import { ApiCodeEnum } from "@/enums/api";
import { useUserStoreHook } from "@/store/modules/user";
import { AuthStorage, redirectToLogin } from "@/utils/auth";

// ============================================
// 微服务配置类型
// ============================================

export interface ServiceConfig {
  /** 服务名称 */
  name: string;
  /** 服务基础 URL（从环境变量读取） */
  baseURL: string;
  /** 超时时间 */
  timeout?: number;
}

// ============================================
// Token 刷新队列管理
// ============================================

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

let refreshing = false;
const queue: Pending[] = [];

async function retryWithRefresh(
  config: InternalAxiosRequestConfig,
  instance: AxiosInstance
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    queue.push({ resolve, reject });

    if (refreshing) return;
    refreshing = true;

    useUserStoreHook()
      .refreshToken()
      .then(() => {
        const token = AuthStorage.getAccessToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;

        queue.forEach(({ resolve }) => instance(config).then(resolve).catch(reject));
      })
      .catch(async () => {
        queue.forEach(({ reject }) => reject(new Error("Token refresh failed")));
        await redirectToLogin("登录已过期，请重新登录");
      })
      .finally(() => {
        queue.length = 0;
        refreshing = false;
      });
  });
}

// ============================================
// HTTP 请求实例工厂函数
// ============================================

/**
 * 创建 HTTP 请求实例
 * @param config 服务配置
 * @returns Axios 实例
 */
export function createHttpInstance(config: ServiceConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 50000,
    headers: { "Content-Type": "application/json;charset=utf-8" },
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
  });

  // ============================================
  // 请求拦截器
  // ============================================

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = AuthStorage.getAccessToken();

      if (config.headers.Authorization === "no-auth") {
        delete config.headers.Authorization;
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // ============================================
  // 响应拦截器
  // ============================================

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // 二进制数据直接返回
      const { responseType } = response.config;
      if (responseType === "blob" || responseType === "arraybuffer") {
        return response;
      }

      const { status, data, message } = response.data;

      if (status === 200) {
        // 分页接口需要同时返回 data 与 page 元信息
        const page = (response.data as any)?.page;
        if (page != null) return { data, page };
        return data;
      }
      ElMessage.error(message || "系统出错");
      return Promise.reject(new Error(message || "Error"));
    },

    async (error) => {
      const { config, response } = error;

      if (!response) {
        ElMessage.error("网络连接失败");
        return Promise.reject(error);
      }

      const { status, message } = response.data as ApiResponse;

      // Token 过期处理 (401 未授权)
      if (response.status === 401) {
        return retryWithRefresh(config, instance);
      }

      // 刷新 Token 失败 (403 禁止访问)
      if (response.status === 403) {
        await redirectToLogin("登录已过期，请重新登录");
        return Promise.reject(new Error(message || "Token Invalid"));
      }

      ElMessage.error(message || "请求失败");
      return Promise.reject(new Error(message || "Error"));
    }
  );

  return instance;
}

// ============================================
// 微服务实例管理
// ============================================

/** 微服务实例缓存 */
const serviceInstances = new Map<string, AxiosInstance>();

/**
 * 获取或创建微服务实例
 * @param config 服务配置
 * @returns Axios 实例
 */
export function getServiceInstance(config: ServiceConfig): AxiosInstance {
  if (!serviceInstances.has(config.name)) {
    const instance = createHttpInstance(config);
    serviceInstances.set(config.name, instance);
  }
  return serviceInstances.get(config.name)!;
}
