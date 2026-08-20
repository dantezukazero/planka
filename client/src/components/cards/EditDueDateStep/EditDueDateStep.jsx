/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import { Button, Checkbox, Form } from 'semantic-ui-react';
import { Input, Popup } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { useForm, useNestedRef } from '../../../hooks';
import parseTime from '../../../utils/parse-time';

import styles from './EditDueDateStep.module.scss';

const createDateTimeFields = (value, t) => ({
  date: t('format:date', {
    postProcess: 'formatDate',
    value,
  }),
  time: t('format:time', {
    postProcess: 'formatDate',
    value,
  }),
});

const parseDateTimeFields = (dateValue, timeValue, t) => {
  const date = t('format:date', {
    postProcess: 'parseDate',
    value: dateValue,
  });

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  let value = t('format:dateTime', {
    postProcess: 'parseDate',
    value: `${dateValue} ${timeValue}`,
  });

  if (Number.isNaN(value.getTime())) {
    value = parseTime(timeValue, date);
  }

  return Number.isNaN(value.getTime()) ? null : value;
};

const isSameDate = (first, second) =>
  first === second || (!!first && !!second && first.getTime() === second.getTime());

const EditDueDateStep = React.memo(({ cardId, onBack, onClose }) => {
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);
  const card = useSelector((state) => selectCardById(state, cardId));
  const defaultStartDate = card.startDate;
  const defaultDueDate = card.dueDate;

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [data, handleFieldChange, setData] = useForm(() => {
    const dueDate = defaultDueDate || new Date().setHours(12, 0, 0, 0);
    const startDate =
      defaultStartDate || new Date(dueDate).setHours(new Date(dueDate).getHours() - 1);

    return {
      startDate: createDateTimeFields(startDate, t).date,
      startTime: createDateTimeFields(startDate, t).time,
      dueDate: createDateTimeFields(dueDate, t).date,
      dueTime: createDateTimeFields(dueDate, t).time,
    };
  });

  const [hasStartDate, setHasStartDate] = useState(!!defaultStartDate);
  const [activeField, setActiveField] = useState(defaultStartDate ? 'start' : 'due');
  const [hasRangeError, setHasRangeError] = useState(false);

  const [startDateFieldRef, handleStartDateFieldRef] = useNestedRef('inputRef');
  const [startTimeFieldRef, handleStartTimeFieldRef] = useNestedRef('inputRef');
  const [dueDateFieldRef, handleDueDateFieldRef] = useNestedRef('inputRef');
  const [dueTimeFieldRef, handleDueTimeFieldRef] = useNestedRef('inputRef');

  const nullableStartDate = useMemo(
    () => parseDateTimeFields(data.startDate, data.startTime, t),
    [data.startDate, data.startTime, t],
  );
  const nullableDueDate = useMemo(
    () => parseDateTimeFields(data.dueDate, data.dueTime, t),
    [data.dueDate, data.dueTime, t],
  );

  const handleSubmit = useCallback(() => {
    setHasRangeError(false);

    if (!nullableDueDate) {
      dueDateFieldRef.current.select();
      return;
    }

    const startDate = hasStartDate ? nullableStartDate : null;
    if (hasStartDate && !startDate) {
      startDateFieldRef.current.select();
      return;
    }

    if (startDate && startDate.getTime() > nullableDueDate.getTime()) {
      setHasRangeError(true);
      startDateFieldRef.current.select();
      return;
    }

    if (!isSameDate(defaultStartDate, startDate) || !isSameDate(defaultDueDate, nullableDueDate)) {
      dispatch(
        entryActions.updateCard(cardId, {
          startDate,
          dueDate: nullableDueDate,
        }),
      );
    }

    onClose();
  }, [
    cardId,
    defaultDueDate,
    defaultStartDate,
    dispatch,
    dueDateFieldRef,
    hasStartDate,
    nullableDueDate,
    nullableStartDate,
    onClose,
    startDateFieldRef,
  ]);

  const handleClearClick = useCallback(() => {
    if (defaultStartDate || defaultDueDate) {
      dispatch(
        entryActions.updateCard(cardId, {
          startDate: null,
          dueDate: null,
        }),
      );
    }

    onClose();
  }, [cardId, defaultDueDate, defaultStartDate, dispatch, onClose]);

  const handleStartToggle = useCallback((_, { checked }) => {
    setHasStartDate(checked);
    setHasRangeError(false);
    setActiveField(checked ? 'start' : 'due');
  }, []);

  const handleDatePickerChange = useCallback(
    (date) => {
      setData((prevData) => ({
        ...prevData,
        [`${activeField}Date`]: t('format:date', {
          postProcess: 'formatDate',
          value: date,
        }),
      }));

      if (activeField === 'start') {
        startTimeFieldRef.current.select();
      } else {
        dueTimeFieldRef.current.select();
      }
    },
    [activeField, dueTimeFieldRef, setData, startTimeFieldRef, t],
  );

  useEffect(() => {
    if (activeField === 'start' && hasStartDate) {
      startDateFieldRef.current.select();
    } else {
      dueDateFieldRef.current.select();
    }
  }, [activeField, dueDateFieldRef, hasStartDate, startDateFieldRef]);

  const activeDate = activeField === 'start' ? nullableStartDate : nullableDueDate;

  return (
    <>
      <Popup.Header onBack={onBack}>
        {t('common.editDateRange', {
          context: 'title',
        })}
      </Popup.Header>
      <Popup.Content>
        <Form data-testid="date-range-editor" onSubmit={handleSubmit}>
          <div className={styles.rangeHeader}>
            <Checkbox
              checked={hasStartDate}
              label={t('common.from')}
              onChange={handleStartToggle}
            />
          </div>
          <div className={styles.fieldWrapper}>
            <div className={styles.fieldBox}>
              <div className={styles.text}>{t('common.date')}</div>
              <Input
                ref={handleStartDateFieldRef}
                name="startDate"
                value={data.startDate}
                maxLength={16}
                disabled={!hasStartDate}
                onFocus={() => setActiveField('start')}
                onChange={handleFieldChange}
              />
            </div>
            <div className={styles.fieldBox}>
              <div className={styles.text}>{t('common.time')}</div>
              <Input
                ref={handleStartTimeFieldRef}
                name="startTime"
                value={data.startTime}
                maxLength={16}
                disabled={!hasStartDate}
                onFocus={() => setActiveField('start')}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          <div className={styles.rangeHeader}>{t('common.until')}</div>
          <div className={styles.fieldWrapper}>
            <div className={styles.fieldBox}>
              <div className={styles.text}>{t('common.date')}</div>
              <Input
                ref={handleDueDateFieldRef}
                name="dueDate"
                value={data.dueDate}
                maxLength={16}
                onFocus={() => setActiveField('due')}
                onChange={handleFieldChange}
              />
            </div>
            <div className={styles.fieldBox}>
              <div className={styles.text}>{t('common.time')}</div>
              <Input
                ref={handleDueTimeFieldRef}
                name="dueTime"
                value={data.dueTime}
                maxLength={16}
                onFocus={() => setActiveField('due')}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          {hasRangeError && <div className={styles.error}>{t('common.invalidDateRange')}</div>}
          <DatePicker
            inline
            disabledKeyboardNavigation
            selected={activeDate}
            onChange={handleDatePickerChange}
          />
          <Button positive content={t('action.save')} />
        </Form>
        <Button
          negative
          content={t('action.remove')}
          className={styles.deleteButton}
          onClick={handleClearClick}
        />
      </Popup.Content>
    </>
  );
});

EditDueDateStep.propTypes = {
  cardId: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

EditDueDateStep.defaultProps = {
  onBack: undefined,
};

export default EditDueDateStep;
