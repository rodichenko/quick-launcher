import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import showdown from 'showdown';

const converter = new showdown.Converter();

function Markdown(
  {
    className,
    children,
    src,
    forwardedRef,
    style,
  },
) {
  const text = typeof children === 'string' ? children : undefined;
  const [source, setSource] = useState(text || '');
  useEffect(() => {
    if (src) {
      fetch(src)
        .then((response) => response.text())
        .then(setSource)
        .catch(() => {});
    }
  }, [src]);
  return (
    <div
      ref={forwardedRef}
      className={className}
      dangerouslySetInnerHTML={{
        __html: converter.makeHtml(source),
      }}
      style={style}
    />
  );
}

Markdown.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  src: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  forwardedRef: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
};

Markdown.defaultProps = {
  className: undefined,
  children: undefined,
  src: undefined,
  style: undefined,
  forwardedRef: undefined,
};

const MarkdownWithRef = React.forwardRef(({
  className, children, src, style,
}, ref) => (
  <Markdown
    className={className}
    src={src}
    style={style}
    forwardedRef={ref}
  >
    {children}
  </Markdown>
));

MarkdownWithRef.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  src: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
};

MarkdownWithRef.defaultProps = {
  className: undefined,
  children: undefined,
  src: undefined,
  style: undefined,
};

export default MarkdownWithRef;
