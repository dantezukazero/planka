Feature: Board calendar
  Scenario: Open an existing due-date card from the board calendar
    Given the user is logged in with email or username "demo" and password "demo"
    And the configured calendar board is open
    When the user selects the Calendar board view
    Then the board calendar should be visible
    And the configured due-date card should be visible in the calendar
    When the user opens the configured due-date card from the calendar
    Then the existing card modal should be visible
