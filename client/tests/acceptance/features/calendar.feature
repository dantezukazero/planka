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
