/**
 * Vue Router 类型扩展
 */
import "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    titleEn?: string;
    icon?: string;
    hidden?: boolean;
    alwaysShow?: boolean;
    affix?: boolean;
    keepAlive?: boolean;
    breadcrumb?: boolean;
    activeMenu?: string;
  }
}
