<template>
  <div>
    <h3>vue-json-viewer 示例</h3>
    <json-viewer :value="data" :expand-depth="2" theme="light" />
  </div>
</template>

<script setup>
import JsonViewer from 'vue-json-viewer';

const data = {
  name: 'demo',
  version: 1,
  items: [
    { id: 1, label: 'A' },
    { id: 2, label: 'B' },
  ],
  meta: { created: '2024-01-01', author: 'dev' },
};
</script>
