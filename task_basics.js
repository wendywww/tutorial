import LoginPage from '../../../pages/auth/login_page.js';
import InboxPage from '../../../pages/inbox_page.js';
import ConversationResponseSection from '../../../pages/customer/conversation/conversation_response_section.js';
import ConversationAssignmentSection from '../../../pages/customer/conversation/conversation_assignment_section.js';
import ConversationHistorySection from '../../../pages/customer/conversation/conversation_history_section.js';
import CompositionSection from '../../../pages/customer/composition/composition_section.js';
import TaskCompositionSection from '../../../pages/customer/composition/task_composition_section.js';
import TaskMenuSection from '../../../pages/customer/conversation/task_menu_section.js';

const currentTimestamp = Date.now();
const orgConfig = browser.ORG_CONFIG;
const user = orgConfig.agentUser;
const taskText = `${currentTimestamp} task_basics automation: Hello, this is some sample task text, with a link: www.google.com`;
const linkText = 'www.google.com';

describe('Basic Task functionality', function() {
  let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(function() {
    // this suite requires longer timeouts
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000;
    LoginPage.open();
    LoginPage.login(user.email, user.password);
    InboxPage.open();
    InboxPage.addNewCustomer();
  });

  describe('creating a new task', function() {
    beforeAll(function() {
      browser.keys('r');
      browser.waitForExist(ConversationAssignmentSection.rootSelector);
      ConversationResponseSection.activateTaskCompositionFromMenu();
    });

    it('opens the composition window', function() {
      expect(CompositionSection.taskCompositionForm).toBeVisible();
    });

    it('focuses on the body of the task composition form', function() {
      expect(TaskCompositionSection.taskCompositionDraftEditor).toHaveFocus();
    });

    describe('filling in task information', function() {
      beforeAll(function() {
        CompositionSection.composeResponse(taskText);
      });

      describe('clicking the calendar prompt', function() {
        beforeAll(function() {
          TaskCompositionSection.taskCalendarPrompt.click();
        });

        it('shows the calendar', function() {
          expect(TaskCompositionSection.taskCalendarPrompt).toBeVisible();
        });

        describe('choosing the next minute and Add Task', function() {
          it('increments the minute and task is added', function() {
            let currMins = new Date().getMinutes();
            TaskCompositionSection.taskMinuteField.setValue(currMins+1);
            TaskCompositionSection.taskApplyTimeButton.click();
            5000;
            ConversationResponseSection.sendComposition();
            expect(ConversationHistorySection.taskContentItems).toBeVisible();
            expect(ConversationHistorySection.taskContentText()).toEqual(taskText);
            //console.log(TaskCompositionSection.taskMinuteField.getValue());
            // Mod 60 for hour wrap around
            //let val_min =('.timeInput-minutes').getValue();
            //console.log(val_min);
            //expect(val_min).toBe((currMins) + 1);
            //expect(Number(TaskCompositionSection.taskMinuteField.getValue())).toBe(Number(currMins) + 1);
          });
        });

        /*describe('confirming the task', function() {
          beforeAll(function() {
            TaskCompositionSection.taskApplyTimeButton.click();
            ConversationResponseSection.sendComposition();
          });

          it('shows up in the conversation', function() {
            expect(ConversationHistorySection.taskContentItems).toBeVisible();
          });

          it('has the task text', function() {
            expect(ConversationHistorySection.taskContentText()).toEqual(taskText);
          });*/

          describe('waiting for the task card', function() {
            beforeAll(function() {
              InboxPage.open();

              // Wait for the expected task card to appear, timeout is 2 mins
              browser.waitUntil(
                () => InboxPage.taskCardsBody.isVisible() && InboxPage.taskCardBody(0) === taskText,
                120000,
                'Task card did not appear'
              );
            });

            describe('clicking on the first task card', function() {
              beforeEach(function() {
                InboxPage.navigateToTask(0);
                ConversationHistorySection.taskContentItems.waitForVisible();
              });

              it('navigates to conversation', function() {
                expect(ConversationHistorySection.taskContentItems).toBeVisible();
              });
            });
          });

          describe('clicking on a link in the task', function() {
            let currentTab = '';

            beforeAll(function() {
              // Save current tab, open a new one, navigate to it (second element in array of tabs)
              currentTab = browser.getCurrentTabId();
              browser.element(`=${linkText}`).click();
              browser.switchTab(browser.getTabIds()[1]);
            });

            it('opens and navigates to the link', function() {
              browser.waitUntil(
                function() {
                  return browser.getUrl().includes(linkText);
                },
                5000,
                `Page was opened at ${browser.getUrl()}, but we expected it to include ${linkText}`
              );
            });

            afterAll(function() {
              // close() takes the destination as the arg, NOT the page to close
              browser.close(currentTab);
            });
          });

          describe('assigning the task to routing group', function() {
            beforeEach(function() {
              InboxPage.open();
              InboxPage.customerConversations.waitForVisible();
              InboxPage.navigateToCustomer(0);
              ConversationHistorySection.taskContentItems.waitForVisible();
              TaskMenuSection.openAssignmentMenu();
              TaskMenuSection.setFilter('Automation - please do not delete');
              TaskMenuSection.clickOption(1);
              ConversationHistorySection.waitForNewTaskRoutingItem();
            });
            itVerifiesAssignment('Automation - please do not delete');
          });

          describe('completing the task', function() {
            beforeAll(function() {
              InboxPage.open();
              InboxPage.customerConversations.waitForVisible();
              InboxPage.navigateToCustomer(0);
              ConversationHistorySection.taskContentItems.waitForVisible();
              ConversationHistorySection.completeTask();
              ConversationHistorySection.waitUntilTaskCompleted();
            });

            it('completes the task', function() {
              expect(ConversationHistorySection.taskHeaderText).toEqual('Completed Task');
            });
          });

        });
      });
    });
  });

  afterAll(function() {
    InboxPage.open();
    InboxPage.customerConversations.waitForVisible();
    InboxPage.navigateToCustomer(0);
    ConversationResponseSection.closeAndNextButton.click();
    // reverting jasmine timeout to the default
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  function itVerifiesAssignment(toAgent) {
    it('displays the expected message and assigns the task', function() {
      expect(TaskMenuSection.assignedTo).toContain(toAgent);
      expect(ConversationHistorySection.lastTaskRoutingItemText).toEqual(`Task routed from you to ${toAgent} by you – just now`);
    });
  }

});