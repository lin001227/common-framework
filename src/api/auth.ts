import { ssoHttp } from "@/utils/request";
import type { LoginRequest, LoginResponse, CaptchaInfo } from "@/types/api/auth";

const AuthAPI = {
  /** 登录接口 - 使用 SSO 微服务 */
  login(data: LoginRequest) {
    const payload: Record<string, any> = {
      staffJobNumber: data.staffJobNumber,
      staffPassword: data.staffPassword,
      captchaId: data.captchaId,
      captcha: data.captcha,
    };

    // tenantId is optional — include only when provided (multi-tenant feature)
    if (typeof data.tenantId !== "undefined") {
      payload.tenantId = data.tenantId;
    }

    return ssoHttp<any, LoginResponse>({
      url: "/sso/web/login",
      method: "post",
      data: payload,
    });
  },

  /** 切换租户(平台用户) - 返回新的 token */
  switchTenant(tenantId: number) {
    return ssoHttp<any, LoginResponse>({
      url: "/sso/switch-tenant",
      method: "post",
      params: { tenantId },
    });
  },

  /** 刷新 token 接口 */
  refreshToken(refreshToken: string) {
    return ssoHttp<any, LoginResponse>({
      url: "/sso/refresh-token",
      method: "post",
      params: { refreshToken },
      headers: {
        Authorization: "no-auth",
      },
    });
  },

  /** 退出登录接口 */
  logout() {
    return ssoHttp({
      url: "/sso/logout",
      method: "delete",
    });
  },

  /** 获取验证码接口 - 使用 SSO 微服务 */
  getCaptcha() {
    return ssoHttp<any, CaptchaInfo>({
      url: "/sso/getCaptcha",
      method: "get",
    });
  },
};

export default AuthAPI;
