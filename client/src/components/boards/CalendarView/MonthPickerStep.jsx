/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from 'semantic-ui-react';
import { Popup } from '../../../lib/custom-ui';

import styles from './MonthPickerStep.module.scss';

const MonthPickerStep = React.memo(({ date, locale, onSelect, onClose }) => {
  const [month, setMonth] = useState(date.getMonth());
  const [year, setYear] = useState(date.getFullYear());
  const monthSelectRef = useRef(null);
  const [t] = useTranslation();

  useEffect(() => {
    monthSelectRef.current.focus();
  }, []);

  const monthOptions = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });

    return Array.from({ length: 12 }, (_, index) => ({
      value: index,
      label: formatter.format(new Date(2026, index, 1)),
    }));
  }, [locale]);

  const yearOptions = useMemo(
    () => Array.from({ length: 21 }, (_, index) => date.getFullYear() - 10 + index),
    [date],
  );

  const handleMonthChange = useCallback(({ currentTarget }) => {
    setMonth(Number(currentTarget.value));
  }, []);

  const handleYearChange = useCallback(({ currentTarget }) => {
    setYear(Number(currentTarget.value));
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      onSelect(year, month);
      onClose();
    },
    [month, year, onClose, onSelect],
  );

  return (
    <>
      <Popup.Header>{t('common.selectMonthAndYear', { context: 'title' })}</Popup.Header>
      <Popup.Content>
        <form onSubmit={handleSubmit}>
          <div className={styles.fields}>
            <label htmlFor="calendar-month-picker-month" className={styles.field}>
              <span>{t('common.month')}</span>
              <select
                id="calendar-month-picker-month"
                ref={monthSelectRef}
                value={month}
                aria-label={t('common.month')}
                className={styles.select}
                onChange={handleMonthChange}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="calendar-month-picker-year" className={styles.field}>
              <span>{t('common.year')}</span>
              <select
                id="calendar-month-picker-year"
                value={year}
                aria-label={t('common.year')}
                className={styles.select}
                onChange={handleYearChange}
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button positive fluid content={t('action.goToDate')} type="submit" />
        </form>
      </Popup.Content>
    </>
  );
});

MonthPickerStep.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  locale: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MonthPickerStep;
