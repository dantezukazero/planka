Feature: Board calendar
  Scenario: Navigate Month, Week, and Agenda and open an existing due-date card
    Given the user is logged in with email or username "demo" and password "demo"
    And the configured calendar board is open
    When the user selects the Calendar board view
    Then the board calendar should be visible
    And the Month calendar view should be visible
    And the configured due-date card should be visible in the calendar
    When the user selects the Week calendar view
    Then the Week calendar view should be visible
    And the configured due-date card should be visible in the calendar
    When the user selects the Agenda calendar view
    Then the Agenda calendar view should be visible
    And the configured due-date card should be visible in the calendar
    When the user opens the configured due-date card from the calendar
    Then the existing card modal should be visible

  Scenario: Persist hidden board views across a reload
    Given the user is logged in with email or username "demo" and password "demo"
    And the configured calendar board is open
    When the user opens the board view manager
    And the user hides the Grid and List board views
    And the user reloads the board
    Then the Grid and List board views should remain hidden

  Scenario: Add a start and due range in the existing card modal
    Given the user is logged in with email or username "demo" and password "demo"
    And the configured calendar board is open
    When the user selects the Calendar board view
    And the user opens the configured due-date card from the calendar
    And the user adds a start to the open card
    Then the open card should show a date range
    When the user reloads the board
    Then the open card should show a date range

  Scenario: Move and resize a configured date range and keep it after reload
    Given the user is logged in with email or username "demo" and password "demo"
    And the configured calendar board is open
    When the user selects the Calendar board view
    Then the configured range card should be visible in the calendar
    When the user selects the Week calendar view
    Then the configured range card should be visible in the calendar
    When the user selects the Agenda calendar view
    Then the configured range card should be visible in the calendar
    When the user selects the Month calendar view
    Then the configured range card should expose start and end resize handles
    When the user drags the configured range card to the next day
    And the user extends the configured range card by one day
    And the user moves the start of the configured range card one day later
    And the user reloads the board
    Then the configured range card should be visible in the calendar

  Scenario: Turn a due-only calendar event into a persistent range by resizing
    Given the user is logged in with email or username "demo" and password "demo"
    And the configured calendar board is open
    When the user selects the Calendar board view
    Then the configured due-only resize card should be visible in the calendar
    And the configured due-only resize card should expose start and end resize handles
    When the user extends the configured due-only resize card by one day
    And the user reloads the board
    And the user opens the configured due-only resize card from the calendar
    Then the open card should show a date range

  Scenario: Expand only a crowded month week instead of opening a popover
    Given the user is logged in with email or username "demo" and password "demo"
    And the configured crowded calendar board is open
    When the user selects the Calendar board view
    Then a calendar More-link should be visible
    When the user expands the crowded calendar week
    Then no calendar More-popover should be visible
    And only the crowded calendar week should be expanded
    And the configured hidden calendar card should be visible in the month grid
    When the user drags the configured hidden calendar card to the next day
    Then the calendar card move should be saved
    When the user navigates to the next calendar month
    Then the Month calendar should start with no expanded weeks

  Scenario: Keep a same-day range resizable inside an expanded month week
    Given the user is logged in with email or username "demo" and password "demo"
    And the configured crowded calendar board is open
    When the user selects the Calendar board view
    And the user expands the crowded calendar week
    Then the configured same-day range should be visible in the expanded week
    And the configured same-day range should expose start and end resize handles
    When the user extends the same-day range from its start by one day
    And the user shrinks the range back to the same day from its start
    And the user extends the same-day range from its end by one day
    Then no card modal should have opened during the resize gestures
    When the user normally opens the configured same-day range
    Then the existing card modal should be visible
