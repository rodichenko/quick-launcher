import React from 'react';

export default function UserAttributes (
  {
    className,
    attributeClassName,
    user,
    skip = []
  }
) {
  if (Object.values(user.attributes || {}).length > 0) {
    const extractAttributes = (...names) => {
      let keys = Object
        .keys(user.attributes || {})
        .sort((a, b) => {
          let indexA = names.map(name => name.toLowerCase()).indexOf(a.toLowerCase());
          let indexB = names.map(name => name.toLowerCase()).indexOf(b.toLowerCase());
          if (indexA === -1) {
            indexA = Infinity;
          }
          if (indexB === -1) {
            indexB = Infinity;
          }
          return indexA - indexB;
        });
      if (keys.filter(key => !skip.includes(key)).length > 0) {
        keys = keys.filter(key => !skip.map(s => s.toLowerCase()).includes(key.toLowerCase()));
      }
      const values = [
        ...new Set(
          keys
            .filter(key => user.attributes.hasOwnProperty(key) && user.attributes[key])
            .map(key => user.attributes[key])
        )];
      return values
        .map(value => (
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
            'lastname'
          )
        }
      </div>
    );
  }
  return null;
}
