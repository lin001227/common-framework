import { store } from "@/store";
import router from "@/router";

import AuthAPI from "@/api/auth";
import UserAPI from "@/api/system/user";
import type { LoginRequest, UserInfo } from "@/types/api";

import { AuthStorage } from "@/utils/auth";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useDictStoreHook } from "@/store/modules/dict";
import { useTagsViewStore } from "@/store";
import { cleanupWebSocket } from "@/composables";

export const useUserStore = defineStore("user", () => {
  // 用户信息
  const userInfo = ref<UserInfo>({} as UserInfo);
  // 记住我状态
  const rememberMe = ref(AuthStorage.getRememberMe());

  /**
   * 登录
   *
   * @param {LoginRequest}
   * @returns
   */
  function login(loginRequest: LoginRequest) {
    return new Promise<void>((resolve, reject) => {
      AuthAPI.login(loginRequest)
        .then((token) => {
          // token 是响应拦截器提取后的 data 字段，直接是 JWT 字符串
          // 保存记住我状态和token
          rememberMe.value = loginRequest.rememberMe ?? false;
          AuthStorage.setTokens(token, token, rememberMe.value); // 使用同一个token作为accessToken和refreshToken
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 获取用户信息
   *
   * @returns {UserInfo} 用户信息
   */
  function getUserInfo() {
    return new Promise<UserInfo>((resolve, reject) => {
      UserAPI.getInfo()
        .then((data) => {
          if (!data) {
            reject("Verification failed, please Login again.");
            return;
          }
          Object.assign(userInfo.value, { ...data });
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 退出登录 - 返回登录页面并清空token
   */
  function logout() {
    return new Promise<void>((resolve) => {
      // 清空所有认证信息
      AuthStorage.clearAuth();

      // // 重置所有系统状态
      // resetAllState();

      // 跳转到登录页面
      router.push("/login");

      resolve();
    });
  }

  /**
   * 重置所有系统状态
   * 统一处理所有清理工作，包括用户凭证、路由、缓存等
   */
  function resetAllState() {
    // 1. 重置用户状态
    resetUserState();

    // 2. 重置其他模块状态
    // 重置路由
    usePermissionStoreHook().resetRouter();
    // 清除字典缓存
    useDictStoreHook().clearDictCache();
    // 清除标签视图
    useTagsViewStore().delAllViews();

    // 3. 清理 WebSocket 连接
    cleanupWebSocket();
    console.log("[UserStore] WebSocket connections cleaned up");

    return Promise.resolve();
  }

  /**
   * 重置用户状态
   * 仅处理用户模块内的状态
   */
  function resetUserState() {
    // 清除用户凭证
    AuthStorage.clearAuth();
    // 重置用户信息
    userInfo.value = {} as UserInfo;
  }

  /**
   * 刷新 token
   */
  function refreshToken() {
    const refreshToken = AuthStorage.getRefreshToken();

    if (!refreshToken) {
      return Promise.reject(new Error("没有有效的刷新令牌"));
    }

    return new Promise<void>((resolve, reject) => {
      AuthAPI.refreshToken(refreshToken)
        .then((token) => {
          // token 是响应拦截器提取后的 data 字段，直接是 JWT 字符串
          // 更新令牌，保持当前记住我状态
          AuthStorage.setTokens(token, token, AuthStorage.getRememberMe());
          resolve();
        })
        .catch((error) => {
          console.log(" refreshToken  刷新失败", error);
          reject(error);
        });
    });
  }

  return {
    userInfo,
    rememberMe,
    isLoggedIn: () => !!AuthStorage.getAccessToken(),
    getUserInfo,
    login,
    logout,
    resetAllState,
    resetUserState,
    refreshToken,
  };
});

/**
 * 在组件外部使用UserStore的钩子函数
 * @see https://pinia.vuejs.org/core-concepts/outside-component-usage.html
 */
export function useUserStoreHook() {
  return useUserStore(store);
}
