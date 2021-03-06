/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, {
  useEffect, useCallback, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import useEditableApplication from './components/utilities/use-editable-application';
import PickUpFolderApplicationModal from './components/shared/pick-up-folder-application-modal';
import { useSettings } from './components/use-settings';
import Modal from './components/shared/modal';
import './app.css';
import LoadingIndicator from './components/shared/loading-indicator';
import useEnterKey, { onEnterKey } from './helpers/use-enter-key';

function Field(
  {
    applicationId: id,
    name,
    field,
    disabled,
    onRedistribute,
    onChange,
    onChangeField,
    settings,
  },
) {
  const onChangeCallback = useCallback((e) => onChange(e.target.value), [onChange]);
  const onRedistributeCallback = useCallback((e) => {
    const doRedistribute = e.target.checked;
    if (
      // eslint-disable-next-line no-restricted-globals
      (!doRedistribute || confirm('All current application info will be lost. Continue?'))
      && onRedistribute
    ) {
      onRedistribute(e.target.checked);
    }
  }, [onRedistribute]);
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState([]);
  const [valuesPending, setValuesPending] = useState(true);
  const [pickUpApplicationVisible, setPickUpApplicationVisible] = useState(false);
  const onClosePickUpAppDialog = useCallback(() => {
    setPickUpApplicationVisible(false);
  }, [setPickUpApplicationVisible]);
  const onSourceClicked = useCallback((e) => {
    if (e) {
      e.stopPropagation();
    }
    setPickUpApplicationVisible(true);
  }, [setPickUpApplicationVisible]);
  const onSelectAppToPublish = useCallback((application) => {
    if (application && onChange && onChangeField) {
      onChange(application?.info?.path);
      Object.values(settings?.folderApplicationPathAttributes || {})
        .forEach((pathKey) => {
          if (
            !/^(user|name)$/i.test(pathKey)
            && application.info
            && Object.prototype.hasOwnProperty.call(application, pathKey)
          ) {
            onChangeField(pathKey, application?.info[pathKey]);
          }
        });
      onChangeField('user', application?.info?.user);
      onChangeField('ownerInfo', application?.info?.ownerInfo);
      onChangeField('pathInfo', application?.pathInfo || {});
    }
    setPickUpApplicationVisible(false);
  }, [onChange, setPickUpApplicationVisible, onChangeField, settings]);
  const selectRef = React.createRef();
  const {
    value = '',
    readOnly = false,
    redistribute = false,
    type = 'text',
    title = name,
    valuesPromise,
  } = field || {};
  useEffect(() => {
    if (valuesPromise) {
      valuesPromise.then((result) => {
        setValuesPending(false);
        setValues(result);
      });
    } else {
      setValuesPending(false);
    }
  }, [setValues, valuesPromise, setValuesPending]);
  const hide = useCallback((e) => {
    if (!visible) {
      return;
    }
    if (e) {
      e.stopPropagation();
    }
    setVisible(false);
  }, [setVisible, visible]);
  const show = useCallback((e) => {
    if (visible) {
      return;
    }
    if (e) {
      e.stopPropagation();
    }
    setVisible(true);
  }, [setVisible, visible]);
  const blurSelect = useCallback(() => {
    if (selectRef.current) {
      selectRef.current.blur();
    }
  }, [selectRef]);
  let component;
  if (onRedistribute && /^source$/i.test(type)) {
    component = (
      <>
        <div
          className={
            classNames(
              'input',
              'select',
              {
                visible,
                disabled: !redistribute || disabled,
              },
            )
          }
          style={{ flex: 1 }}
          onClick={onSourceClicked}
        >
          {value || '\u00A0'}
        </div>
        <input
          id={`application-${name}-source-editable`}
          type="checkbox"
          disabled={disabled}
          checked={redistribute}
          onChange={onRedistributeCallback}
        />
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label
          htmlFor={`application-${name}-source-editable`}
          style={{
            fontSize: 'smaller',
            marginLeft: 2,
          }}
        >
          Redistribute application
        </label>
        <PickUpFolderApplicationModal
          visible={pickUpApplicationVisible}
          onClose={onClosePickUpAppDialog}
          onSelectApplication={onSelectAppToPublish}
          ignoredApplications={[id]}
        />
      </>
    );
  } else if (/^select$/i.test(type) && values.length > 0) {
    component = (
      <div
        ref={selectRef}
        tabIndex={readOnly || disabled ? -1 : 0}
        className={
          classNames(
            'input',
            'select',
            {
              visible,
              disabled: readOnly || disabled,
            },
          )
        }
        onFocus={disabled || readOnly ? undefined : show}
        onBlur={hide}
        style={{ flex: 1 }}
      >
        {value || '\u00A0'}
        <div
          tabIndex={-1}
          className="overlay"
          onClick={hide}
        >
          {'\u00A0'}
        </div>
        <div
          tabIndex={-1}
          className="options"
          onMouseDown={(e) => e.preventDefault()}
        >
          {
            valuesPending && (
              <div className="options-loading">
                Loading...
              </div>
            )
          }
          {
            !valuesPending && (
              values.map((option) => (
                <div
                  tabIndex={-1}
                  key={option.value || option}
                  className={
                    classNames(
                      'option',
                      {
                        selected: value === (option.value || option),
                      },
                    )
                  }
                  onClick={() => {
                    blurSelect();
                    onChange(option.value || option);
                  }}
                >
                  {option.title || option.value || option}
                </div>
              ))
            )
          }
        </div>
      </div>
    );
  } else {
    component = (
      <input
        tabIndex={readOnly || disabled ? -1 : 0}
        id={`application-${name}`}
        type="text"
        className="input"
        value={value}
        readOnly={readOnly || disabled}
        onChange={onChangeCallback}
        style={{ flex: 1 }}
      />
    );
  }
  return (
    <div className="form-item">
      <label htmlFor={`application-${name}`}>
        {title}
        :
      </label>
      {component}
    </div>
  );
}

Field.propTypes = {
  applicationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  field: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  onRedistribute: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  onChangeField: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  settings: PropTypes.object,
};

Field.defaultProps = {
  disabled: false,
  settings: {},
  onRedistribute: undefined,
};

function EditFolderApplication(
  {
    application,
    applications = [],
    editCustomAttributes = false,
    goBack,
  },
) {
  const {
    info,
    disabled,
    addAttribute,
    removeAttribute,
    onChange,
    onRedistribute,
    onChangeAttribute,
    publish,
    remove,
    pending,
    operation,
    validate,
    validation,
    stopValidation,
  } = useEditableApplication(application);
  const [validationErrorDetailsVisible, setValidationErrorDetailsVisible] = useState(false);
  const openValidationErrorDetails = useCallback(() => {
    setValidationErrorDetailsVisible(true);
  }, [setValidationErrorDetailsVisible]);
  const closeValidationErrorDetails = useCallback(() => {
    setValidationErrorDetailsVisible(false);
  }, [setValidationErrorDetailsVisible]);
  const settings = useSettings();
  const [actionError, setActionError] = useState(undefined);
  const doPublish = useCallback(() => {
    publish()
      .then(goBack)
      .catch((e) => setActionError(e.message));
  }, [publish, setActionError]);
  const doRemove = useCallback(() => {
    remove()
      .then((success) => {
        if (success && goBack) {
          goBack();
        }
      })
      .catch((e) => setActionError(e.message));
  }, [remove, setActionError]);
  const restrictedNames = useMemo(() => applications
    .filter((app) => application.id !== app.id && app.published)
    .map((app) => new RegExp(`^${app.name}$`, 'i')), [application, applications]);
  const {
    name,
    description,
    fullDescription,
    icon,
    infoFields,
    attributes,
    isReservedName,
  } = info;
  const applicationNameIsInUse = useMemo(
    () => restrictedNames.some((rn) => rn.test(name)),
    [name, restrictedNames],
  );
  const inputRef = React.createRef();
  const onIconClick = useCallback(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.click();
    }
  }, [inputRef, disabled]);
  const onEditName = useCallback(
    (e) => onChange('name', e.target.value),
    [onChange],
  );
  const onEditDescription = useCallback(
    (e) => onChange('description', e.target.value),
    [onChange],
  );
  const onEditFullDescription = useCallback(
    (e) => onChange('fullDescription', e.target.value),
    [onChange],
  );
  const onEditIcon = useCallback(
    (e) => {
      onChange('icon', e.target.files[0]);
      inputRef.current.value = '';
    },
    [onChange, inputRef],
  );
  const isDuplicate = useCallback((o) => (attributes || [])
    .filter((attribute) => (attribute.name || '').trim() === (o || '').trim())
    .length > 1, [attributes]);
  const fieldIsRequired = useCallback((field) => {
    const requiredFields = (settings?.folderApplicationRequiredFields || [])
      .concat('name');
    return requiredFields.includes(field);
  }, [settings]);
  const fieldIsEmpty = useCallback(
    (field, value) => !value && fieldIsRequired(field),
    [fieldIsRequired],
  );
  const attributeHasError = useCallback((attribute) => !attribute.name
      || !attribute.value
      || isReservedName(attribute.name)
      || isDuplicate(attribute.name), [isDuplicate, isReservedName]);
  const iconError = fieldIsEmpty('icon', icon);
  const error = !name
    || applicationNameIsInUse
    || attributes.some(attributeHasError)
    || fieldIsEmpty('name', name)
    || fieldIsEmpty('description', description)
    || fieldIsEmpty('fullDescription', fullDescription)
    || iconError;
  const addAttributeKeyPressed = useEnterKey(addAttribute, !disabled);
  const doRemoveKeyPressed = useEnterKey(doRemove, !disabled);
  const validateKeyPressed = useEnterKey(validate, !disabled);
  const doPublishKeyPressed = useEnterKey(doPublish, !disabled && !error);
  if (!application || pending) {
    return null;
  }
  const {
    published,
  } = application;
  const fields = Object.keys(infoFields);
  const validationRequired = !!(settings?.folderApplicationValidation?.required);
  const {
    valid: applicationValid,
    pending: applicationIsValidating,
    error: applicationValidationErrorRaw,
    validated,
    validatedAt,
  } = validation || {};
  const applicationValidationError = applicationValidationErrorRaw
    ? applicationValidationErrorRaw.split('\n')
    : undefined;
  return (
    <div className="edit-application-container">
      <div
        className={classNames('edit-icon', { 'icon-error': iconError })}
        onClick={onIconClick}
        style={
          icon
            ? { backgroundImage: `url(${icon})` }
            : {}
        }
      >
        <div className="frame">
          <input
            ref={inputRef}
            type="file"
            readOnly={disabled}
            className="file-input"
            multiple={false}
            onChange={onEditIcon}
            value={undefined}
          />
        </div>
      </div>
      <div className="form-item">
        <label
          htmlFor="application-name"
        >
          Name:
        </label>
        <input
          id="application-name"
          type="text"
          readOnly={disabled}
          className={classNames('input', { error: fieldIsEmpty('name', name) || applicationNameIsInUse })}
          value={name || ''}
          onChange={onEditName}
          style={{ flex: 1 }}
        />
      </div>
      {
        !name && (
          <div className="form-item error">
            Name is required
          </div>
        )
      }
      {
        name && applicationNameIsInUse && (
          <div className="form-item error">
            This application name is already used
          </div>
        )
      }
      <div
        className="form-item textarea"
      >
        <label htmlFor="application-short-description">
          Short Description:
        </label>
        <input
          id="application-short-description"
          type="text"
          readOnly={disabled}
          className={classNames('input', { error: fieldIsEmpty('description', description) })}
          value={description || ''}
          onChange={onEditDescription}
          style={{ flex: 1 }}
        />
      </div>
      {
        fieldIsEmpty('description', description) && (
          <div className="form-item error">
            Short Description is required
          </div>
        )
      }
      <div
        className="form-item textarea"
      >
        <label htmlFor="application-description">
          Description:
        </label>
        <textarea
          id="application-description"
          className={classNames('input', { error: fieldIsEmpty('fullDescription', fullDescription) })}
          readOnly={disabled}
          value={fullDescription || ''}
          onChange={onEditFullDescription}
          style={{ flex: 1 }}
          rows={2}
        />
      </div>
      {
        fieldIsEmpty('fullDescription', fullDescription) && (
          <div className="form-item error">
            Description is required
          </div>
        )
      }
      <div style={{ marginTop: 5 }}>
        {'\u00A0'}
      </div>
      {
        fields.map((field) => (
          <Field
            applicationId={application?.id}
            key={field}
            name={field}
            field={infoFields[field]}
            settings={settings}
            disabled={disabled}
            onChange={(value) => onChange(field, value)}
            onChangeField={onChange}
            onRedistribute={
              published && onRedistribute
                ? onRedistribute
                : undefined
            }
          />
        ))
      }
      <div style={{ marginTop: 5, display: editCustomAttributes ? 'block' : 'none' }}>
        {'\u00A0'}
      </div>
      {
        editCustomAttributes && attributes.map((attribute) => (
          <div key={attribute.id}>
            <div
              className="form-item attribute"
            >
              <input
                id={`application-attribute-${attribute.id}-name`}
                type="text"
                className={
                  classNames(
                    'input',
                    'attribute-name',
                    {
                      error: !attribute.name
                        || isDuplicate(attribute.name)
                        || isReservedName(attribute.name),
                    },
                  )
                }
                readOnly={disabled}
                value={attribute.name || ''}
                onChange={(e) => onChangeAttribute(({ ...attribute, name: e.target.value }))}
                style={{ width: '25vw', flex: 'unset' }}
                placeholder="Attribute name"
              />
              <input
                id={`application-attribute-${attribute.id}-value`}
                type="text"
                className={
                  classNames(
                    'input',
                    'attribute-value',
                    {
                      error: !attribute.value,
                    },
                  )
                }
                readOnly={disabled}
                value={attribute.value || ''}
                onChange={(e) => onChangeAttribute(({ ...attribute, value: e.target.value }))}
                style={{
                  width: '25vw', flex: 'unset', marginLeft: 5, marginRight: 5,
                }}
                placeholder="Attribute value"
              />
              <div
                className={
                  classNames(
                    'edit-application-button',
                    { disabled },
                  )
                }
                tabIndex={0}
                role="button"
                onKeyPress={onEnterKey(() => removeAttribute(attribute), !disabled)}
                onClick={disabled ? undefined : () => removeAttribute(attribute)}
                style={{ fontSize: 'small' }}
              >
                Remove
              </div>
            </div>
            {
              (attributeHasError(attribute)) && (
                <div className="form-item attribute error">
                  <div className="attribute-name">
                    {
                      !attribute.name && 'Attribute name is required'
                    }
                    {
                      attribute.name
                      && isReservedName(attribute.name)
                      && `"${attribute.name}" is reserved`
                    }
                    {
                      attribute.name
                      && !isReservedName(attribute.name)
                      && isDuplicate(attribute.name)
                      && 'Duplicate'
                    }
                  </div>
                  <div className="attribute-value">
                    {
                      !attribute.value && 'Attribute value is required'
                    }
                  </div>
                </div>
              )
            }
          </div>
        ))
      }
      <div
        style={{ marginTop: 10, display: editCustomAttributes ? 'block' : 'none' }}
        className="edit-application-add-attribute"
      >
        <div
          className={
            classNames(
              'edit-application-button',
              { disabled },
            )
          }
          tabIndex={0}
          role="button"
          onKeyPress={addAttributeKeyPressed}
          onClick={disabled ? undefined : addAttribute}
        >
          Add gateway.spec attribute
        </div>
      </div>
      <div style={{ marginTop: 5 }}>
        {'\u00A0'}
      </div>
      {
        actionError && (
          <div className="edit-application-actions-error">
            {actionError}
          </div>
        )
      }
      {
        !applicationIsValidating && validated && (
          <div
            className={
              classNames(
                'edit-application-validation-info',
                {
                  'validation-error': !applicationValid,
                  'has-validation-error-description': !!applicationValidationError,
                },
              )
            }
            onClick={
              applicationValidationError ? openValidationErrorDetails : undefined
            }
          >
            <div
              className="main"
            >
              {
                applicationValid
                  ? (
                    <span>
                      Application validated at
                      {validatedAt}
                    </span>
                  )
                  : (
                    <span>
                      Application is invalid (checked at
                      {validatedAt}
                      )
                    </span>
                  )
              }
            </div>
            {
              applicationValidationError && (
                <div
                  className="error"
                >
                  {
                    applicationValidationError.map((line, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <p key={index}>
                        {line}
                      </p>
                    ))
                  }
                </div>
              )
            }
          </div>
        )
      }
      {
        applicationIsValidating && (
          <div className="edit-application-validation-info">
            Validating application...
          </div>
        )
      }
      <div
        className="edit-application-actions-container"
      >
        {
          published
            ? (
              <div
                className={
                  classNames(
                    'edit-application-button',
                    'remove-button',
                    { disabled },
                  )
                }
                tabIndex={0}
                role="button"
                onKeyPress={doRemoveKeyPressed}
                onClick={disabled ? undefined : doRemove}
              >
                REMOVE
              </div>
            )
            : '\u00A0'
        }
        <div>
          {
            !applicationIsValidating && (
              <div
                className={
                  classNames(
                    'edit-application-button',
                    'publish-button',
                    'validate-button',
                    { disabled },
                  )
                }
                tabIndex={0}
                role="button"
                onKeyPress={validateKeyPressed}
                onClick={
                  (disabled)
                    ? undefined
                    : validate
                }
              >
                VALIDATE
              </div>
            )
          }
          {
            applicationIsValidating && stopValidation && (
              <div
                className={
                  classNames(
                    'edit-application-button',
                    'publish-button',
                    'validate-button',
                  )
                }
                tabIndex={0}
                role="button"
                onKeyPress={stopValidation}
                onClick={stopValidation}
              >
                STOP VALIDATION
              </div>
            )
          }
          {
            (!validationRequired || applicationValid) && (
              <div
                className={
                  classNames(
                    'edit-application-button',
                    'publish-button',
                    { disabled: disabled || error },
                  )
                }
                tabIndex={0}
                role="button"
                onKeyPress={doPublishKeyPressed}
                onClick={(disabled || error) ? undefined : doPublish}
              >
                {published ? 'UPDATE' : 'PUBLISH'}
              </div>
            )
          }
        </div>
      </div>
      <Modal
        visible={!!operation}
        closable={false}
        className="operation-modal"
      >
        <div className="operation-info">
          <LoadingIndicator />
          {operation ? operation.name : undefined}
        </div>
        <div className="operation-details">
          {operation?.details}
        </div>
        <div
          className="operation-progress"
          style={{ visibility: operation && operation.progress !== undefined ? 'visible' : 'hidden' }}
        >
          <div
            className="operation-progress-bar"
            style={{ width: `${(Math.min(100, (operation?.progress || 0) * 100))}%` }}
          >
            {'\u00A0'}
          </div>
        </div>
      </Modal>
      <Modal
        visible={validationErrorDetailsVisible}
        className="validation-details-modal"
        onClose={closeValidationErrorDetails}
      >
        {
          !!applicationValidationError && applicationValidationError.map((line, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <p key={index}>
              {line}
            </p>
          ))
        }
      </Modal>
    </div>
  );
}

EditFolderApplication.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  application: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  applications: PropTypes.array,
  editCustomAttributes: PropTypes.bool,
  goBack: PropTypes.func,
};

EditFolderApplication.defaultProps = {
  application: undefined,
  applications: [],
  editCustomAttributes: false,
  goBack: undefined,
};

export default EditFolderApplication;
