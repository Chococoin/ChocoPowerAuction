import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import { Button, Welcome } from '@storybook/react/demo';

storiesOf('Bienvenido', module).add('a Storybook', () => <Welcome showApp={linkTo('Button')} />);

storiesOf('Boton', module)
  .add('con texto', () => <Button onClick={action('clicked')}>Hello Button</Button>)
  .add('con emojis', () => (
    <Button onClick={action('clicked')}>
      <span role="img" aria-label="so cool">
        😀 😎 👍 💯
      </span>
    </Button>
  ));
