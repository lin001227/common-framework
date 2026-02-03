/**
 * 国际化工具函数
 */
import i18n from "./index";

/**
 * 翻译路由标题
 * 用于面包屑、侧边栏、标签页等场景
 */
export function translateRouteTitle(title: string, titleEn?: string): string {
  // 获取当前语言环境
  const currentLocale = i18n.global.locale.value;

  // 如果当前是英文环境且提供了英文标题，则使用英文标题
  if (currentLocale === "en" && titleEn) {
    return titleEn;
  }

  // 否则使用中文标题
  const key = `route.${title}`;
  return i18n.global.te(key) ? i18n.global.t(key) : title;
}
