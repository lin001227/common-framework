/**
 * 认证相关类型定义
 */

/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 员工工号 */
  staffJobNumber: string;
  /** 员工密码 */
  staffPassword: string;
  /** 验证码缓存key */
  captchaId?: string;
  /** 验证码 */
  captcha?: string;
  /** 记住我 */
  rememberMe?: boolean;
  /** 租户ID */
  tenantId?: number;
}

/**
 * 登录响应（响应拦截器自动提取 data 字段，直接返回 token 字符串）
 */
export type LoginResponse = string;

/**
 * 验证码响应
 */
export interface CaptchaInfo {
  /** 验证码缓存key */
  captchaId: string;
  /** 验证码图片Base64 */
  captchaImage: string;
}
