import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSettings } from '../use-settings';
import './help.css';
import Markdown from './markdown';

function Help(
  {
    className,
  },
) {
  const [visible, setVisible] = useState(false);
  const show = useCallback(() => setVisible(true), [setVisible]);
  const hide = useCallback(() => setVisible(false), [setVisible]);
  const settings = useSettings();
  if (settings?.help) {
    return (
      <div
        className={
          classNames(
            'help-button-container',
            className,
            { visible },
          )
        }
      >
        <div
          role="button"
          tabIndex={0}
          onKeyPress={show}
          className="help-button"
          onClick={show}
        >
          ?
        </div>
        <div
          className="overlay"
          onClick={hide}
          role="button"
          tabIndex={0}
          onKeyPress={hide}
        >
          {'\u00A0'}
        </div>
        <Markdown
          className="content"
          src={settings?.help}
        />
      </div>
    );
  }
  return null;
}

Help.propTypes = {
  className: PropTypes.string,
};

Help.defaultProps = {
  className: undefined,
};

export default Help;
