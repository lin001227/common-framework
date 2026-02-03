/**
 * HTTP 请求工具 - 微服务支持
 *
 * 此文件为向后兼容层，重新导出自 request-services.ts
 * 新代码请使用：
 * - import http from '@/utils/request'; // 默认服务
 * - import { ssoHttp, sasHttp } from '@/utils/request'; // 微服务实例
 */

import http, { ssoHttp, sasHttp, getHttpByService } from "./request-services";

export { ssoHttp, sasHttp, getHttpByService };
export default http;
