/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Checkbox, Icon } from 'semantic-ui-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import interactionPlugin from '@fullcalendar/react/interaction';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import { push } from '../../../lib/redux-router';
import { usePopup } from '../../../lib/popup';

import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Paths from '../../../constants/Paths';
import { BoardMembershipRoles } from '../../../constants/Enums';
import {
  CalendarViews,
  changeCalendarView,
  goToCalendarMonth,
  loadCalendarView,
  navigateCalendar,
  saveCalendarView,
} from '../../../utils/calendar-preferences';
import { loadFullCalendarLocale } from '../../../utils/fullcalendar-locales';
import {
  CALENDAR_VISUAL_DURATION_OPTIONS,
  getCalendarEventClassName,
  getCalendarEventTimeText,
} from '../../../utils/calendar-event-display';
import createCalendarEventInteractionGuard from '../../../utils/calendar-event-interaction';
import {
  CALENDAR_EXPANDED_WEEK_ATTRIBUTE,
  CALENDAR_EXPANDED_WEEK_MIN_HEIGHT_PROPERTY,
  CALENDAR_MONTH_DAY_CELL_CLASS,
  CALENDAR_MONTH_WEEK_CLASS,
  addExpandedMonthWeek,
  getExpandedMonthWeekMinHeight,
  resetExpandedMonthWeeks,
} from '../../../utils/calendar-month-expansion';
import {
  applyCalendarEditingPermissions,
  getCalendarEventDropUpdate,
  getCalendarEventResizeRollbackUpdate,
  getCalendarEventResizeUpdate,
  saveCalendarEventChange,
} from '../../../utils/calendar-event-editing';
import MonthPickerStep from './MonthPickerStep';

import styles from './CalendarView.module.scss';
import globalStyles from '../../../styles.module.scss';

const NAVIGATION_ACTIONS = ['prev', 'today', 'next'];

const CalendarView = React.memo(() => {
  const events = useSelector(selectors.selectCalendarEventsForCurrentBoard);
  const myEvents = useSelector(selectors.selectMyCalendarEventsForCurrentBoard);
  const hasDueDateCards = useSelector(selectors.selectHasDueDateCardsForCurrentBoard);
  const currentUserId = useSelector(selectors.selectCurrentUserId);
  const canEditDates = useSelector((state) => {
    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);

    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

  const dispatch = useDispatch();
  const [t, i18n] = useTranslation();
  const calendarRef = useRef(null);
  const calendarElementRef = useRef(null);
  const initialCalendarViewRef = useRef(loadCalendarView(currentUserId));
  const [calendarView, setCalendarView] = useState(initialCalendarViewRef.current);
  const [displayedDate, setDisplayedDate] = useState(() => new Date());
  const [fullCalendarLocale, setFullCalendarLocale] = useState('en');
  const [isMyTasksOnly, setIsMyTasksOnly] = useState(false);
  const [expandedMonthWeeks, setExpandedMonthWeeks] = useState(() => new Map());
  const eventInteractionGuardRef = useRef(null);

  if (eventInteractionGuardRef.current === null) {
    eventInteractionGuardRef.current = createCalendarEventInteractionGuard();
  }

  const language = i18n.resolvedLanguage || 'en-US';
  const visibleEvents = isMyTasksOnly ? myEvents : events;
  const editableEvents = useMemo(
    () => applyCalendarEditingPermissions(visibleEvents, canEditDates),
    [canEditDates, visibleEvents],
  );

  useEffect(() => {
    let isCurrent = true;

    loadFullCalendarLocale(language).then((locale) => {
      if (isCurrent) {
        setFullCalendarLocale(locale);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [language]);

  useEffect(
    () => () => {
      eventInteractionGuardRef.current.clear((frame) => window.cancelAnimationFrame(frame));
    },
    [],
  );

  const plugins = useMemo(
    () => [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, classicThemePlugin],
    [],
  );

  const calendarViewOptions = useMemo(
    () => [
      { value: CalendarViews.MONTH, label: t('common.month') },
      { value: CalendarViews.WEEK, label: t('common.week') },
      { value: CalendarViews.AGENDA, label: t('common.agenda') },
    ],
    [t],
  );

  const displayedPeriod = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        month: 'long',
        year: 'numeric',
      }).format(displayedDate),
    [displayedDate, language],
  );

  const getCalendarApi = useCallback(() => calendarRef.current && calendarRef.current.getApi(), []);

  const clearExpandedMonthWeeks = useCallback(() => {
    setExpandedMonthWeeks(resetExpandedMonthWeeks);
  }, []);

  useLayoutEffect(() => {
    const calendarElement = calendarElementRef.current;
    if (!calendarElement) {
      return undefined;
    }

    const clearExpandedRows = () => {
      calendarElement
        .querySelectorAll(`[${CALENDAR_EXPANDED_WEEK_ATTRIBUTE}="true"]`)
        .forEach((rowElement) => {
          rowElement.removeAttribute(CALENDAR_EXPANDED_WEEK_ATTRIBUTE);
          rowElement.style.removeProperty(CALENDAR_EXPANDED_WEEK_MIN_HEIGHT_PROPERTY);
        });
    };

    clearExpandedRows();

    expandedMonthWeeks.forEach((minHeight, weekKey) => {
      const dayCell = calendarElement.querySelector(
        `.${CALENDAR_MONTH_DAY_CELL_CLASS}[data-date="${weekKey}"]`,
      );
      const rowElement = dayCell && dayCell.closest(`.${CALENDAR_MONTH_WEEK_CLASS}`);

      if (rowElement) {
        rowElement.setAttribute(CALENDAR_EXPANDED_WEEK_ATTRIBUTE, 'true');
        rowElement.style.setProperty(CALENDAR_EXPANDED_WEEK_MIN_HEIGHT_PROPERTY, `${minHeight}px`);
      }
    });

    const updateSizeFrame = window.requestAnimationFrame(() => {
      const calendarApi = getCalendarApi();
      if (calendarApi) {
        calendarApi.updateSize();
      }
    });

    return () => {
      window.cancelAnimationFrame(updateSizeFrame);
      clearExpandedRows();
    };
  }, [calendarView, expandedMonthWeeks, fullCalendarLocale, getCalendarApi]);

  const handleMyTasksChange = useCallback((_, { checked }) => {
    setIsMyTasksOnly(checked);
  }, []);

  const handleNavigationClick = useCallback(
    ({ currentTarget: { value } }) => {
      clearExpandedMonthWeeks();
      navigateCalendar(getCalendarApi(), value);
    },
    [clearExpandedMonthWeeks, getCalendarApi],
  );

  const handleCalendarViewChange = useCallback(
    ({ currentTarget: { value } }) => {
      clearExpandedMonthWeeks();

      if (changeCalendarView(getCalendarApi(), value)) {
        setCalendarView(saveCalendarView(currentUserId, value));
      }
    },
    [clearExpandedMonthWeeks, currentUserId, getCalendarApi],
  );

  const handleMonthSelect = useCallback(
    (year, month) => {
      clearExpandedMonthWeeks();
      goToCalendarMonth(getCalendarApi(), year, month);
    },
    [clearExpandedMonthWeeks, getCalendarApi],
  );

  const handleDatesSet = useCallback(
    ({ view }) => {
      clearExpandedMonthWeeks();
      setDisplayedDate(view.calendar.getDate());

      if (Object.values(CalendarViews).includes(view.type)) {
        setCalendarView(view.type);
      }
    },
    [clearExpandedMonthWeeks],
  );

  const handleDayCellDidMount = useCallback(({ el, view }) => {
    if (view.type !== CalendarViews.MONTH) {
      return;
    }

    el.classList.add(CALENDAR_MONTH_DAY_CELL_CLASS);

    const rowElement = el.closest('[role="row"]');
    if (rowElement && calendarElementRef.current?.contains(rowElement)) {
      rowElement.classList.add(CALENDAR_MONTH_WEEK_CLASS);
    }
  }, []);

  const handleDayCellWillUnmount = useCallback(({ el }) => {
    el.classList.remove(CALENDAR_MONTH_DAY_CELL_CLASS);
  }, []);

  const handleMoreLinkClick = useCallback((info) => {
    if (info.view.type !== CalendarViews.MONTH) {
      return 'popover';
    }

    const calendarElement = calendarElementRef.current;
    const targetElement = info.jsEvent.currentTarget;
    const rowElement = targetElement.closest(`.${CALENDAR_MONTH_WEEK_CLASS}`);

    if (calendarElement && rowElement && calendarElement.contains(rowElement)) {
      const firstDayCell = rowElement.querySelector(`.${CALENDAR_MONTH_DAY_CELL_CLASS}[data-date]`);
      const eventElement = rowElement.querySelector('.calendar-card-event');
      const weekKey = firstDayCell?.dataset.date;

      if (weekKey) {
        const minHeight = getExpandedMonthWeekMinHeight({
          currentHeight: rowElement.getBoundingClientRect().height,
          eventHeight: eventElement?.getBoundingClientRect().height || 0,
          hiddenEventCount: info.hiddenSegs.length,
        });

        setExpandedMonthWeeks((currentExpandedWeeks) =>
          addExpandedMonthWeek(currentExpandedWeeks, weekKey, minHeight),
        );
      }
    }

    // FullCalendar v7 opens the default popover only for a falsy or "popover" result.
    // A truthy handled result keeps the user in the month grid while React expands the row.
    return true;
  }, []);

  const handleMoreLinkDidMount = useCallback(({ el, view }) => {
    if (view.type === CalendarViews.MONTH) {
      el.removeAttribute('aria-haspopup');
      el.removeAttribute('aria-controls');
    }
  }, []);

  const handleEventInteractionStart = useCallback(() => {
    eventInteractionGuardRef.current.start((frame) => window.cancelAnimationFrame(frame));
  }, []);

  const handleEventInteractionStop = useCallback(() => {
    eventInteractionGuardRef.current.stop(
      (callback) => window.requestAnimationFrame(callback),
      (frame) => window.cancelAnimationFrame(frame),
    );
  }, []);

  const handleEventClick = useCallback(
    ({ event }) => {
      if (eventInteractionGuardRef.current.shouldIgnoreClick()) {
        return;
      }

      dispatch(push(Paths.CARDS.replace(':id', event.extendedProps.cardId)));
    },
    [dispatch],
  );

  const saveEventChange = useCallback(
    ({ event, oldEvent, revert }, getUpdate, getRollbackUpdate, updateContext) => {
      saveCalendarEventChange({
        event,
        oldEvent,
        revert,
        getUpdate,
        getRollbackUpdate,
        updateContext,
        updateCard: (cardId, data, options) => {
          dispatch(entryActions.updateCard(cardId, data, options));
        },
      });
    },
    [dispatch],
  );

  const handleEventDrop = useCallback(
    (info) => {
      saveEventChange(info, getCalendarEventDropUpdate);
    },
    [saveEventChange],
  );

  const handleEventResize = useCallback(
    (info) => {
      saveEventChange(info, getCalendarEventResizeUpdate, getCalendarEventResizeRollbackUpdate, {
        startDelta: info.startDelta,
        endDelta: info.endDelta,
        viewType: info.view.type,
      });
    },
    [saveEventChange],
  );

  const renderEventContent = useCallback(
    ({ event, timeText }) => {
      const labels = event.extendedProps.labels || [];
      const visibleTimeText = getCalendarEventTimeText(event, timeText, language);

      return (
        <div className={styles.eventContent} title={event.title}>
          {visibleTimeText && (
            <span className={classNames(styles.eventTime, 'calendar-card-event-time')}>
              {visibleTimeText}
            </span>
          )}
          {labels.length > 0 && (
            <span className={styles.labelMarkers} aria-hidden="true">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className={classNames(
                    styles.labelMarker,
                    globalStyles[`background${upperFirst(camelCase(label.color))}`],
                  )}
                />
              ))}
            </span>
          )}
          <span className={styles.eventTitle}>{event.title}</span>
        </div>
      );
    },
    [language],
  );

  const MonthPickerPopup = usePopup(MonthPickerStep, {
    position: 'bottom left',
  });

  let emptyState = null;
  if (visibleEvents.length === 0) {
    emptyState = hasDueDateCards
      ? t('common.noCardsMatchCurrentFilters')
      : t('common.noCardsWithDueDate');
  }

  return (
    <div className={styles.wrapper} data-testid="calendar-view">
      <div className={styles.toolbar} data-testid="calendar-toolbar">
        <div className={styles.toolbarPrimary}>
          <MonthPickerPopup date={displayedDate} locale={language} onSelect={handleMonthSelect}>
            <button
              type="button"
              aria-haspopup="dialog"
              title={t('common.selectMonthAndYear', { context: 'title' })}
              className={classNames(styles.toolbarButton, styles.periodButton)}
            >
              <span>{displayedPeriod}</span>
              <Icon fitted name="dropdown" />
            </button>
          </MonthPickerPopup>
          <div className={styles.navigation}>
            {NAVIGATION_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                value={action}
                title={t(`common.calendarNavigation_${action}`)}
                aria-label={t(`common.calendarNavigation_${action}`)}
                className={classNames(
                  styles.toolbarButton,
                  action === 'today' && styles.todayButton,
                )}
                onClick={handleNavigationClick}
              >
                {action === 'prev' && <Icon fitted name="chevron left" />}
                {action === 'today' && t('common.today')}
                {action === 'next' && <Icon fitted name="chevron right" />}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarSecondary}>
          <Checkbox
            toggle
            checked={isMyTasksOnly}
            label={t('common.myTasks')}
            onChange={handleMyTasksChange}
          />
          <label htmlFor="calendar-view-select" className={styles.viewSelectLabel}>
            <span className={styles.screenReaderOnly}>{t('common.calendarView')}</span>
            <select
              id="calendar-view-select"
              value={calendarView}
              aria-label={t('common.calendarView')}
              className={styles.viewSelect}
              onChange={handleCalendarViewChange}
            >
              {calendarViewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon fitted name="dropdown" className={styles.viewSelectIcon} />
          </label>
        </div>
      </div>
      <div ref={calendarElementRef} className={styles.calendar} data-calendar-view={calendarView}>
        <FullCalendar
          ref={calendarRef}
          className={styles.fullCalendar}
          plugins={plugins}
          themeSystem="classic"
          initialView={initialCalendarViewRef.current}
          locale={fullCalendarLocale}
          timeZone="local"
          forceEventDuration={CALENDAR_VISUAL_DURATION_OPTIONS.forceEventDuration}
          defaultTimedEventDuration={CALENDAR_VISUAL_DURATION_OPTIONS.defaultTimedEventDuration}
          allDayMaintainDuration
          events={editableEvents}
          eventOrder="start,title"
          eventClass={getCalendarEventClassName}
          eventBeforeClass="calendar-card-start-resize-handle"
          eventAfterClass="calendar-card-end-resize-handle"
          eventColor="var(--calendar-event-background)"
          eventContrastColor="var(--calendar-event-text)"
          moreLinkClass="calendar-more-link"
          moreLinkClick={handleMoreLinkClick}
          moreLinkDidMount={handleMoreLinkDidMount}
          popoverClass={styles.morePopover}
          popoverCloseClass={styles.morePopoverClose}
          editable={canEditDates}
          selectable={false}
          navLinks={false}
          eventStartEditable={canEditDates}
          eventDurationEditable={canEditDates}
          eventResizableFromStart={canEditDates}
          headerToolbar={false}
          dayMaxEvents
          nowIndicator
          stickyHeaderDates
          height="100%"
          dayCellDidMount={handleDayCellDidMount}
          dayCellWillUnmount={handleDayCellWillUnmount}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventDragStart={handleEventInteractionStart}
          eventDragStop={handleEventInteractionStop}
          eventDrop={handleEventDrop}
          eventResizeStart={handleEventInteractionStart}
          eventResizeStop={handleEventInteractionStop}
          eventResize={handleEventResize}
          datesSet={handleDatesSet}
        />
        {emptyState && (
          <div className={styles.emptyState} role="status">
            <Icon name="calendar outline" size="large" />
            <span>{emptyState}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default CalendarView;
