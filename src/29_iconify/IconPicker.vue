<template>
  <div class="icon-picker">
    <!-- 触发区：显示当前图标或占位 -->
    <div
      class="icon-picker-trigger"
      @click="openDialog"
    >
      <iconify-icon
        v-if="modelValue"
        :icon="modelValue"
        :width="triggerIconSize"
        :height="triggerIconSize"
        class="current-icon"
      />
      <span v-else class="placeholder">{{ placeholder }}</span>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="选择图标"
      width="520px"
      :close-on-click-modal="true"
      destroy-on-close
      class="icon-picker-dialog"
      @closed="onDialogClosed"
    >
      <div class="icon-picker-body">
        <div class="toolbar">
          <el-select
            v-model="currentPrefix"
            placeholder="选择图标集"
            filterable
            style="width: 200px"
            @change="onPrefixChange"
          >
            <el-option
              v-for="(info, prefix) in collections"
              :key="prefix"
              :label="info.name || prefix"
              :value="prefix"
            >
              <span>{{ info.name || prefix }}</span>
              <span class="option-meta">({{ info.total }})</span>
            </el-option>
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索图标名"
            clearable
            style="width: 200px; margin-left: 8px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-scrollbar class="icon-list-wrap" height="320px">
          <div v-loading="loading" class="icon-grid">
            <div
              v-for="name in filteredIconNames"
              :key="name"
              class="icon-item"
              :class="{ active: modelValue === `${currentPrefix}:${name}` }"
              @click="selectIcon(name)"
            >
              <iconify-icon
                :icon="`${currentPrefix}:${name}`"
                :width="gridIconSize"
                :height="gridIconSize"
              />
            </div>
          </div>
        </el-scrollbar>

        <div v-if="currentIconLabel" class="selected-hint">
          当前: {{ currentIconLabel }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';

const API_BASE = 'https://api.iconify.design';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '点击选择图标' },
  triggerIconSize: { type: [Number, String], default: 24 },
  gridIconSize: { type: [Number, String], default: 28 },
  /** 预设图标集，不传则打开弹窗时请求 /collections */
  prefixes: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);

const dialogVisible = ref(false);
const collections = ref({});
const currentPrefix = ref('');
const iconNames = ref([]);
const searchKeyword = ref('');
const loading = ref(false);

const filteredIconNames = computed(() => {
  const kw = (searchKeyword.value || '').trim().toLowerCase();
  if (!kw) return iconNames.value;
  return iconNames.value.filter((name) => name.toLowerCase().includes(kw));
});

const currentIconLabel = computed(() => {
  if (!props.modelValue) return '';
  return props.modelValue;
});

function openDialog() {
  dialogVisible.value = true;
  if (props.modelValue) {
    const [prefix] = props.modelValue.split(':');
    if (prefix) currentPrefix.value = prefix;
  }
  if (!currentPrefix.value && Object.keys(collections.value).length)
    currentPrefix.value = Object.keys(collections.value)[0];
}

function onDialogClosed() {
  searchKeyword.value = '';
}

async function loadCollections() {
  if (props.prefixes.length) {
    const next = {};
    for (const p of props.prefixes) {
      next[p] = { name: p, total: 0 };
    }
    collections.value = next;
    if (!currentPrefix.value) currentPrefix.value = props.prefixes[0] || '';
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/collections`);
    if (!res.ok) throw new Error('collections failed');
    const data = await res.json();
    collections.value = data;
    if (!currentPrefix.value && Object.keys(data).length)
      currentPrefix.value = Object.keys(data)[0];
  } catch (e) {
    console.warn('IconPicker: load collections failed', e);
    collections.value = { mdi: { name: 'Material Design Icons', total: 0 }, heroicons: { name: 'Heroicons', total: 0 } };
    currentPrefix.value = 'mdi';
  }
}

async function loadIcons(prefix) {
  if (!prefix) {
    iconNames.value = [];
    return;
  }
  loading.value = true;
  iconNames.value = [];
  try {
    const res = await fetch(`${API_BASE}/collection?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) throw new Error('collection failed');
    const data = await res.json();
    const set = new Set();
    (data.uncategorized || []).forEach((n) => set.add(n));
    if (data.categories) {
      Object.values(data.categories).forEach((arr) => arr.forEach((n) => set.add(n)));
    }
    iconNames.value = Array.from(set).sort();
  } catch (e) {
    console.warn('IconPicker: load icons failed', e);
  } finally {
    loading.value = false;
  }
}

function onPrefixChange() {
  loadIcons(currentPrefix.value);
}

function selectIcon(name) {
  const value = `${currentPrefix.value}:${name}`;
  emit('update:modelValue', value);
  dialogVisible.value = false;
}

watch(dialogVisible, (visible) => {
  if (visible) {
    loadCollections().then(() => loadIcons(currentPrefix.value));
  }
});

watch(
  () => props.modelValue,
  (val) => {
    if (val && dialogVisible.value) {
      const [prefix] = val.split(':');
      if (prefix && prefix !== currentPrefix.value) currentPrefix.value = prefix;
    }
  }
);
</script>

<style scoped>
.icon-picker-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  padding: 6px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  background: var(--el-fill-color-blank);
}
.icon-picker-trigger:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.current-icon {
  display: block;
}
.icon-picker-body .toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.option-meta {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.icon-list-wrap {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 4px;
  padding: 8px;
}
.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--el-text-color-regular);
}
.icon-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}
.icon-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.selected-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
