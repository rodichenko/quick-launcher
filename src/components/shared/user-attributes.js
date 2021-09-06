import React from 'react';
import PropTypes from 'prop-types';

function UserAttributes(
  {
    className,
    attributeClassName,
    user,
    skip = [],
  },
) {
  if (Object.values(user.attributes || {}).length > 0) {
    const extractAttributes = (...names) => {
      let keys = Object
        .keys(user.attributes || {})
        .sort((a, b) => {
          let indexA = names.map((name) => name.toLowerCase()).indexOf(a.toLowerCase());
          let indexB = names.map((name) => name.toLowerCase()).indexOf(b.toLowerCase());
          if (indexA === -1) {
            indexA = Infinity;
          }
          if (indexB === -1) {
            indexB = Infinity;
          }
          return indexA - indexB;
        });
      if (keys.filter((key) => !skip.includes(key)).length > 0) {
        keys = keys.filter((key) => !skip.map((s) => s.toLowerCase()).includes(key.toLowerCase()));
      }
      const values = [
        ...new Set(
          keys
            .filter((key) => Object.prototype.hasOwnProperty.call(user.attributes, key)
              && user.attributes[key])
            .map((key) => user.attributes[key]),
        )];
      return values
        .map((value) => (
          <span key={value} className={attributeClassName}>
            {value}
          </span>
        ));
    };
    return (
      <div className={className}>
        {
          extractAttributes(
            'name',
            'first name',
            'firstname',
            'last name',
            'lastname',
          )
        }
      </div>
    );
  }
  return null;
}

UserAttributes.propTypes = {
  className: PropTypes.string,
  attributeClassName: PropTypes.string,
  user: PropTypes.shape({
    // eslint-disable-next-line react/forbid-prop-types
    attributes: PropTypes.object,
  }),
  skip: PropTypes.arrayOf(PropTypes.string),
};

UserAttributes.defaultProps = {
  className: undefined,
  attributeClassName: undefined,
  user: undefined,
  skip: [],
};

export default UserAttributes;
