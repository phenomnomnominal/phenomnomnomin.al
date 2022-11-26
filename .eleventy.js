const inclusiveLangPlugin = require('@11ty/eleventy-plugin-inclusive-language');

const SCRIPTS_PATH = './src/_scripts';
const STYLES_PATH = './src/_styles';

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy(SCRIPTS_PATH);
  eleventyConfig.addWatchTarget(SCRIPTS_PATH);

  eleventyConfig.addPassthroughCopy(STYLES_PATH);
  eleventyConfig.addWatchTarget(STYLES_PATH);

  eleventyConfig.addPlugin(inclusiveLangPlugin);

  return {
    dir: {
      input: 'src',
      output: 'public',
    },
  };
};
