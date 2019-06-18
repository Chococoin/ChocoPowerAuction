import { configure } from '@storybook/react';

function loadStories() {
  require('../src/demo');
  require('../src/stories');
}

configure(loadStories, module);
