import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function Timer({ className, enabled }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (enabled) {
      setSeconds(0);
      const timer = setInterval(setSeconds, 1000, (o) => o + 1);
      return () => {
        clearInterval(timer);
      };
    }
    return () => {};
  }, [enabled, setSeconds]);
  if (enabled) {
    return (
      <div className={className}>
        {seconds > 9 ? seconds : `0${seconds}`}
      </div>
    );
  }
  return null;
}

Timer.propTypes = {
  className: PropTypes.string,
  enabled: PropTypes.bool,
};

Timer.defaultProps = {
  className: undefined,
  enabled: false,
};

export default Timer;
