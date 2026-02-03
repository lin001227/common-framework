<template>
  <section class="app-main" :style="{ height: appMainHeight }">
    <router-view>
      <template #default="{ Component, route }">
        <transition :name="transitionName" mode="out-in">
          <keep-alive :include="cachedViews">
            <component :is="currentComponent(Component, route)" :key="route.fullPath" />
          </keep-alive>
        </transition>
      </template>
    </router-view>

    <!-- 返回顶部按钮 -->
    <el-backtop target=".app-main">
      <div class="i-svg:backtop w-6 h-6" />
    </el-backtop>
  </section>
</template>

<script setup lang="ts">
import { type RouteLocationNormalized } from "vue-router";
import { useSettingsStore, useTagsViewStore } from "@/store";
import variables from "@/styles/variables.module.scss";
import Error404 from "@/views/error/404.vue";

const { cachedViews } = toRefs(useTagsViewStore());

const settingsStore = useSettingsStore();

// 当前组件
const wrapperMap = new Map<string, Component>();
const currentComponent = (component: Component, route: RouteLocationNormalized) => {
  if (!component) {
    console.warn(`No component provided for route: ${route.path}`);
    return h(Error404);
  }

  const { fullPath: componentName } = route; // 使用路由路径作为组件名称
  let wrapper = wrapperMap.get(componentName);

  if (!wrapper) {
    wrapper = {
      name: componentName,
      render: () => {
        try {
          // 增强的组件渲染错误处理
          const renderedComponent = h(component);

          // 添加组件加载监控
          if (process.env.NODE_ENV === "development") {
            console.log(`Successfully rendered component for route: ${componentName}`);
          }

          return renderedComponent;
        } catch (error) {
          console.error(`Error rendering component for route: ${componentName}`, {
            error,
            componentType: typeof component,
            routeInfo: {
              path: route.path,
              fullPath: route.fullPath,
              name: route.name,
              meta: route.meta,
            },
            timestamp: new Date().toISOString(),
          });

          // 返回更友好的错误页面
          return h(
            "div",
            {
              class: "component-error-page flex-center flex-col p-8",
            },
            [
              h("div", { class: "text-2xl font-bold text-red-500 mb-4" }, "组件加载失败"),
              h("div", { class: "text-gray-600 mb-4" }, `路径: ${route.path}`),
              h("div", { class: "text-sm text-gray-500 mb-4" }, "请检查组件路径配置或联系管理员"),
              h(
                "el-button",
                {
                  type: "primary",
                  onClick: () => window.location.reload(),
                },
                "刷新页面"
              ),
            ]
          );
        }
      },
    };
    wrapperMap.set(componentName, wrapper);
  }

  // 添加组件数量限制
  if (wrapperMap.size > 100) {
    const firstKey = wrapperMap.keys().next().value;
    if (firstKey) {
      wrapperMap.delete(firstKey);
    }
  }

  return h(wrapper);
};

const appMainHeight = computed(() => {
  if (settingsStore.showTagsView) {
    return `calc(100vh - ${variables["navbar-height"]} - ${variables["tags-view-height"]})`;
  } else {
    return `calc(100vh - ${variables["navbar-height"]})`;
  }
});

// 页面切换动画名称
const transitionName = computed(() => {
  return settingsStore.pageSwitchingAnimation ?? "";
});
</script>

<style lang="scss" scoped>
.app-main {
  position: relative;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);

  /* fade */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease-in-out;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* fade-slide */
  .fade-slide-leave-active,
  .fade-slide-enter-active {
    transition: all 0.3s;
  }
  .fade-slide-enter-from {
    opacity: 0;
    transform: translateX(-30px);
  }
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }

  /* fade-scale */
  .fade-scale-leave-active,
  .fade-scale-enter-active {
    transition: all 0.28s;
  }
  .fade-scale-enter-from {
    opacity: 0;
    transform: scale(1.2);
  }
  .fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.8);
  }
}
</style>
