<template>
  <AccordionRoot type="multiple" class="accordion">
    <AccordionItem value="item-1" class="item">
      <AccordionHeader>
        <AccordionTrigger class="trigger">Section 1</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent class="content">Content for section 1.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2" class="item">
      <AccordionHeader>
        <AccordionTrigger class="trigger">Section 2</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent class="content">Content for section 2.</AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

<script setup>
import {
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from 'reka-ui';
</script>

<style scoped>
.accordion { border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
.item { border-bottom: 1px solid #eee; }
.item:last-child { border-bottom: none; }
.trigger { width: 100%; padding: 12px 16px; text-align: left; cursor: pointer; background: #fafafa; border: none; }
.trigger:hover { background: #f0f0f0; }
.content { padding: 12px 16px; background: #fff; }
</style>
