import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import Page404 from "@/views/error/404.vue";

// 模拟语言包
const messages = {
  "zh-cn": {
    error: {
      pageNotFound: {
        title: "OOPS",
        subtitle: "该页面无法访问",
        message: "抱歉，您访问的页面不存在",
        description: "请确认您输入的网址是否正确，或者点击下方按钮返回首页",
        backToHome: "返回首页",
      },
    },
  },
  en: {
    error: {
      pageNotFound: {
        title: "OOPS",
        subtitle: "This page is inaccessible",
        message: "Sorry, the page you visited does not exist",
        description:
          "Please confirm that the URL you entered is correct, or click the button below to return to the homepage",
        backToHome: "Back to Home",
      },
    },
  },
};

describe("404页面国际化测试", () => {
  it("应该正确显示中文内容", () => {
    const i18n = createI18n({
      legacy: false,
      locale: "zh-cn",
      messages,
    });

    const wrapper = mount(Page404, {
      global: {
        plugins: [i18n],
      },
    });

    // 验证中文内容
    expect(wrapper.text()).toContain("OOPS");
    expect(wrapper.text()).toContain("该页面无法访问");
    expect(wrapper.text()).toContain("抱歉，您访问的页面不存在");
    expect(wrapper.text()).toContain("请确认您输入的网址是否正确，或者点击下方按钮返回首页");
    expect(wrapper.text()).toContain("返回首页");
  });

  it("应该正确显示英文内容", () => {
    const i18n = createI18n({
      legacy: false,
      locale: "en",
      messages,
    });

    const wrapper = mount(Page404, {
      global: {
        plugins: [i18n],
      },
    });

    // 验证英文内容
    expect(wrapper.text()).toContain("OOPS");
    expect(wrapper.text()).toContain("This page is inaccessible");
    expect(wrapper.text()).toContain("Sorry, the page you visited does not exist");
    expect(wrapper.text()).toContain(
      "Please confirm that the URL you entered is correct, or click the button below to return to the homepage"
    );
    expect(wrapper.text()).toContain("Back to Home");
  });
});
