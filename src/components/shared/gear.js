import React from 'react';
import PropTypes from 'prop-types';
import useEnterKey from '../../helpers/use-enter-key';

function Gear({
  className,
  tabIndex,
  onClick,
  children,
}) {
  const onKeyPress = useEnterKey(onClick);
  return (
    <div
      tabIndex={tabIndex}
      role="button"
      onKeyPress={onKeyPress}
      onClick={onClick}
      className={className}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {children}
      </div>
      <svg
        enableBackground="new 0 0 91 91"
        height="24px"
        viewBox="0 0 91 91"
        width="24px"
        xmlns="http://www.w3.org/2000/svg"
        fill="#cccccc"
      >
        <g>
          <path d="M45.574,38.253c-5.443,0-9.871,4.428-9.871,9.871s4.428,9.871,9.871,9.871s9.871-4.428,9.871-9.871   S51.018,38.253,45.574,38.253z M45.574,54.595c-3.568,0-6.471-2.904-6.471-6.471c0-3.568,2.902-6.471,6.471-6.471   c3.566,0,6.471,2.902,6.471,6.471C52.045,51.69,49.141,54.595,45.574,54.595z" />
          <path d="M64.057,27.726l-6.975,4.029c-0.971-0.686-2.004-1.281-3.086-1.781v-8.061H37.152v8.061   c-1.008,0.467-1.979,1.021-2.898,1.654l-6.936-4.111l-8.586,14.488l6.936,4.109c-0.078,0.709-0.115,1.373-0.115,2.01   c0,0.574,0.029,1.158,0.092,1.785l-6.98,4.031l8.422,14.584l6.979-4.031c0.973,0.686,2.004,1.281,3.088,1.781v8.061h16.844v-8.061   c1.008-0.467,1.977-1.021,2.896-1.654l6.936,4.111l8.586-14.488l-6.934-4.109c0.078-0.705,0.115-1.371,0.115-2.01   c0-0.576-0.029-1.158-0.092-1.785l6.98-4.031L64.057,27.726z M61.824,44.538l0.17,1.143c0.137,0.928,0.203,1.703,0.203,2.443   c0,0.797-0.076,1.656-0.232,2.631l-0.182,1.141l5.973,3.539l-5.119,8.639l-5.973-3.541l-0.914,0.713   c-1.244,0.969-2.617,1.754-4.078,2.33l-1.076,0.424v6.936H40.551v-6.934l-1.074-0.426c-1.533-0.605-2.955-1.428-4.23-2.443   l-0.906-0.723l-6.01,3.471l-5.021-8.695l6.016-3.475l-0.17-1.143c-0.137-0.928-0.203-1.703-0.203-2.443   c0-0.801,0.074-1.639,0.232-2.635l0.178-1.139l-5.971-3.537l5.119-8.639l5.973,3.543l0.914-0.713   c1.248-0.971,2.621-1.756,4.08-2.332l1.074-0.424v-6.936h10.045v6.934l1.076,0.426c1.529,0.605,2.953,1.428,4.229,2.443   l0.908,0.723l6.008-3.469l5.023,8.693L61.824,44.538z" />
        </g>
      </svg>
    </div>
  );
}

Gear.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
  tabIndex: PropTypes.number,
  children: PropTypes.node,
};

Gear.defaultProps = {
  className: undefined,
  onClick: undefined,
  children: false,
  tabIndex: 0,
};

export default Gear;
