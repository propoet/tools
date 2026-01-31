<template>
  <div class="icon-demo">
    <Camera :size="32" color="#3b82f6" />
    <Check :size="24" color="green" stroke-width="2" />
    <ChevronDown :size="20" class="text-gray-600" />
    <Check aria-label="已完成" :size="24" />
  </div>
</template>

<script setup>
/**
 * lucide-vue-next 示例：按需导入图标组件并传 props
 * 在 Vue 3 项目中引用此组件即可（需先 pnpm add lucide-vue-next）
 */
import { Camera, Check, ChevronDown } from "lucide-vue-next";
</script>
