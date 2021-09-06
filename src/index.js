import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'isomorphic-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from '@reach/router';
import ModeSelector from './mode-selector';

ReactDOM.render(
  (
    <Router>
      <ModeSelector path="/" exact />
      <ModeSelector path="/*" launch />
    </Router>
  ),
  document.getElementById('root'),
);
