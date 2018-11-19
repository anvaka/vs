<template>
  <div class='query-input-container' @click.prevent='focus'>
    <input class='search-input' 
      :value='value' @input="$emit('input', $event.target.value)"
      type='text' :placeholder='placeholder' autofocus ref='input'>
    <span class='search-measure' ref='measure'></span>
    <span type='text' class='suffix' ref='suffix'>{{patternReminder}}</span> 
  </div>
</template>

<script>
export default {
  props: ['placeholder', 'value', 'pattern'],
  watch: {
    value(newValue) {
      this.ensureSuffixPos();
    }
  },
  computed: {
    patternReminder() {
      return this.pattern.replace('[query]', '');
    }
  },
  methods: {
    focus() {
      this.$refs.input.focus();
    },
    ensureSuffixPos() {
      // Good thing that this doesn't happen often. Otherwise this would be super slow
      const {suffix, measure} = this.$refs;

      measure.innerText = this.value;
      let textWidth = this.$refs.measure.getBoundingClientRect();

      measure.innerText = this.patternReminder;
      let suffixBox = measure.getBoundingClientRect();

      let selfBox = this.$el.getBoundingClientRect();
      let maxValue = selfBox.width - suffixBox.width;

      let suffixPos = Math.min(textWidth.right - selfBox.left + 4, maxValue);
      this.$refs.input.style.paddingRight = suffixBox.width + 'px';

      if (this.value.length === 0) {
        suffix.style.visibility = 'hidden';
      } else {
        suffix.style.visibility = 'visible';
      }
      suffix.style.left = suffixPos + 'px';
    }
  },
  mounted() {
    this.ensureSuffixPos();
  }
}
</script>

<style lang="stylus">
@import('../vars.styl');

.query-input-container {
  position: relative;
  span {
    display: inline;
  }
  .search-measure, .suffix {
    position: absolute;
  }
  .suffix {
    right: 0;
    top: 0;
    bottom: 0;
    position: absolute;
    display: flex;
    color: #eaaac0;
  }

  input {
    border: none;
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    padding: 0;
    color: highlight-color
    height: 100%;
    font-size: 16px;
    &:focus {
      outline: none;
    }
  }
}

.search-measure {
  white-space: pre;
  visibility: hidden;
}

input.search-input {
  width: 100%;

}

</style>
