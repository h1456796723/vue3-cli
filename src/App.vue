<template>
  <router-link :to="{name: 'home'}">Home</router-link>&nbsp;
  <router-link :to="{name: 'about'}">About</router-link>

  <div class="view-box">
    <router-view></router-view>
  </div>

</template>

<script setup lang='ts'>
</script>

<style lang="scss" scoped>
.view-box{
  width: 300px;
  height: 500px;
  border: 1px solid pink;
  margin-top: 20px;
}
</style>