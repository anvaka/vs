<template>
  <div class='query-input-container' @click.prevent='focus'>
    <input class='search-input' 
      :value='value' @input="$emit('input', $event.target.value)"
      type='text' :placeholder='placeholder' autofocus ref='input'>
    <span type='text' class='prefix' ref='prefix'>{{patternPrefix}}</span> 
    <span class='search-measure' ref='measure'></span>
    <span type='text' class='suffix' ref='suffix'>{{patternReminder}}</span> 
  </div>
</template>

<script>
/**
 * A user control that renders input string with read-only prefix/suffix
 */
export default {
  props: ['placeholder', 'value', 'pattern'],
  watch: {
    value(newValue) {
      this.ensureSuffixPos();
    }
  },
  computed: {
    patternReminder() {
      return this.pattern.split('[query]')[1];
    },
    patternPrefix() {
      return this.pattern.split('[query]')[0];
    }
  },
  methods: {
    focus() {
      this.$refs.input.focus();
    },
    ensureSuffixPos() {
      // We have to measure each bit of text (prefix, content, suffix), so that
      // we can place labels accordingly.
      // Good thing that this doesn't happen often. Otherwise this would be super slow
      const {suffix, measure, prefix} = this.$refs;

      measure.innerText = this.value;
      let textWidth = this.$refs.measure.getBoundingClientRect();

      measure.innerText = this.patternReminder;
      let suffixBox = measure.getBoundingClientRect();

      measure.innerText = this.patternPrefix;
      let prefixBox = measure.getBoundingClientRect();

      let selfBox = this.$el.getBoundingClientRect();
      let maxValue = selfBox.width - suffixBox.width;

      let suffixPos = Math.min(prefixBox.width + textWidth.width + 4, maxValue);
      if (this.value.length === 0) {
        // When there is nothing entered, let's hide prefix/suffix.
        suffix.style.visibility = 'hidden';
        prefix.style.visibility = 'hidden';
        this.$refs.input.style.paddingRight = '0';
        this.$refs.input.style.paddingLeft = '0';
      } else {
        suffix.style.visibility = 'visible';
        prefix.style.visibility = 'visible';
        suffix.style.left = suffixPos + 'px';
        prefix.style.right = prefixBox.width + 'px';
        this.$refs.input.style.paddingRight = suffixBox.width + 'px';
        this.$refs.input.style.paddingLeft = prefixBox.width + 'px';
      }
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
    left: 0;
  }
  .suffix {
    right: 0;
    top: 0;
    bottom: 0;
    position: absolute;
    display: flex;
    color: #eaaac0;
  }

  .prefix {
    left: 0;
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
