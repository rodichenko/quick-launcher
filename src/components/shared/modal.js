import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import Close from './close';
import './modal.css';
import useEnterKey from '../../helpers/use-enter-key';

const hiddenTimeoutMs = 100;

function Modal(
  {
    className,
    children,
    visible,
    onClose,
    closable = true,
    title,
    closeButton = false,
  },
) {
  const animationRef = useRef(undefined);
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = undefined;
    }
    if (visible) {
      setHidden(false);
    } else {
      animationRef.current = setTimeout(() => setHidden(true), hiddenTimeoutMs);
    }
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      animationRef.current = undefined;
    };
  }, [visible, setHidden, animationRef]);
  const onCloseKeyPress = useEnterKey(onClose, closable);
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);
  return ReactDOM.createPortal(
    (
      <div
        className={
          classNames(
            'modal',
            { visible, hidden },
          )
        }
      >
        <div
          tabIndex={closable ? 0 : -1}
          role="button"
          onKeyPress={onCloseKeyPress}
          className={classNames('overlay')}
          onClick={closable ? onClose : undefined}
        >
          {'\u00A0'}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <div
            className={
              classNames(
                className,
                'window',
              )
            }
            tabIndex={-1}
            role="button"
            onKeyPress={stopPropagation}
            onClick={stopPropagation}
          >
            {
              title && (
                <div
                  className="title"
                >
                  {title}
                </div>
              )
            }
            {children}
          </div>
          {
            closeButton && (
              <div className="modal-close-button-container">
                <Close
                  className="modal-close-button"
                  onClick={onClose}
                />
              </div>
            )
          }
        </div>
      </div>
    ),
    document.getElementById('modals'),
  );
}

Modal.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  closable: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  closeButton: PropTypes.bool,
};

Modal.defaultProps = {
  className: undefined,
  children: undefined,
  visible: false,
  onClose: undefined,
  closable: true,
  title: undefined,
  closeButton: false,
};

export default Modal;
