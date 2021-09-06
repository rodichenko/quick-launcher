import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './loading-indicator.css';

function LoadingIndicator({ style, className }) {
  return (
    <svg
      className={classNames('loading-indicator', className)}
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <circle cx="25" cy="25" r="20" />
    </svg>
  );
}

LoadingIndicator.propTypes = {
  className: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
};

LoadingIndicator.defaultProps = {
  className: undefined,
  style: undefined,
};

export default LoadingIndicator;
