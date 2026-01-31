<template>
  <div>
    <h3>vue-tippy 示例</h3>
    <button v-tippy="'这是指令方式的提示'">指令 v-tippy</button>
    <Tippy content="这是组件方式的提示" placement="bottom">
      <button>组件 Tippy</button>
    </Tippy>
  </div>
</template>

<script setup>
import { Tippy } from 'vue-tippy';
// 若已全局 app.use(VueTippy)，则无需再 import Tippy，且 v-tippy 已可用
</script>
