import React from 'react';

import { storiesOf } from '@storybook/react';
import Navbar from '../components/Navbar';
import { Button } from '../components/Button';

storiesOf('Navbar', module)
  .add('ChocoCrypto Image', () => <Navbar />);

storiesOf('Button', module)
  .add('styled button', () => <Button>HolaMundo</Button>);