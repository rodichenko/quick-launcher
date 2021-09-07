import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { onEnterKey } from '../helpers/use-enter-key';

function Selection(
  {
    config,
    value,
    onChange = (() => {}),
  },
) {
  if (!config) {
    return null;
  }
  const {
    values = [],
    itemValue = ((o) => o),
    itemName = ((o) => o),
  } = config;
  if (!values.length) {
    return null;
  }
  const handleClick = (item) => (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isSelected = itemValue(item) === value;
    if (isSelected && !config.required && onChange) {
      onChange(undefined);
    } else if (onChange) {
      onChange(itemValue(item));
    }
  };
  return (
    <>
      {
        values.map((item) => (
          <div
            key={itemValue(item)}
            className={
              classNames(
                'value',
                {
                  selected: itemValue(item) === value,
                },
              )
            }
            tabIndex={0}
            role="button"
            onKeyPress={onEnterKey(handleClick(item))}
            onClick={handleClick(item)}
          >
            {itemName(item)}
          </div>
        ))
      }
    </>
  );
}

const ConfigPropType = PropTypes.shape({
  // eslint-disable-next-line react/forbid-prop-types
  values: PropTypes.array,
  itemValue: PropTypes.func,
  itemName: PropTypes.func,
  required: PropTypes.bool,
  type: PropTypes.string,
});

Selection.propTypes = {
  config: ConfigPropType,
  // eslint-disable-next-line react/forbid-prop-types
  value: PropTypes.any,
  onChange: PropTypes.func,
};

Selection.defaultProps = {
  config: undefined,
  value: undefined,
  onChange: undefined,
};

function SettingValue({ config, value, onChange }) {
  if (!config) {
    return null;
  }
  if (/^radio$/i.test(config.type)) {
    return (
      <Selection
        config={config}
        value={value}
        onChange={onChange}
      />
    );
  }
  return null;
}

SettingValue.propTypes = {
  config: ConfigPropType,
  // eslint-disable-next-line react/forbid-prop-types
  value: PropTypes.any,
  onChange: PropTypes.func,
};

SettingValue.defaultProps = {
  config: undefined,
  value: undefined,
  onChange: undefined,
};

export default SettingValue;
