import { ssoHttp } from "@/utils/request";

// ============================================
// SSO 登录相关接口类型定义
// ============================================

/** 登录参数 */
export interface ILoginParams {
  username: string;
  password: string;
  captchaCode?: string;
  captchaId?: string;
  [key: string]: any;
}

/** 修改密码参数 */
export interface IUpdatePasswdParams {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  [key: string]: any;
}

// ============================================
// SSO 登录 API
// ============================================

const SsoAPI = {
  /**
   * 获取图形验证码
   */
  getCaptcha() {
    return ssoHttp({
      url: "/sso/getCaptcha",
      method: "get",
    });
  },

  /**
   * 登录
   * @param params 登录参数
   * @returns
   */
  login(params: ILoginParams) {
    return ssoHttp({
      url: "/sso/web/login",
      method: "post",
      data: params,
    });
  },

  /**
   * 获取用户信息
   */
  getStaffMessage() {
    const json = JSON.parse(localStorage.getItem("application-cloud-user") || "{}");
    return ssoHttp({
      url: "/sso/getStaffMessage",
      method: "get",
      headers: {
        "X-Ca-Token": json.token,
      },
    });
  },

  /**
   * 菜单权限
   * @param input 查询条件
   * @returns
   */
  getMenuList(input: any) {
    const json = JSON.parse(localStorage.getItem("application-cloud-user") || "{}");
    return ssoHttp({
      url: "/sso/getMenuMessageList",
      method: "post",
      headers: {
        "X-Ca-Token": json.token,
      },
      data: input,
    });
  },

  /**
   * 修改密码
   * @param params 修改密码请求参数
   * @returns
   */
  changePassword(params: IUpdatePasswdParams) {
    const json = JSON.parse(localStorage.getItem("application-cloud-user") || "{}");
    return ssoHttp({
      url: "/sso/changePassword",
      method: "post",
      headers: {
        "X-Ca-Token": json.token,
      },
      data: params,
    });
  },

  /**
   * 获取手机验证码
   * @param params
   * @returns
   */
  getMobilePhoneCode(params: any) {
    const json = JSON.parse(localStorage.getItem("application-cloud-user") || "{}");
    return ssoHttp({
      url: "/sso/getMobilePhoneCode",
      method: "get",
      headers: {
        "X-Ca-Token": json.token,
      },
      params, // 注意：GET 请求应该使用 params 而不是 data
    });
  },
};

export default SsoAPI;
