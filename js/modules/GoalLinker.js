// GoalLinker.js - Goal linking system for cross-tab coherence
// Enables linking interventions to specific SMART goals

import { el } from '../ui/utils.js';
import { createIcon } from '../ui/Icons.js';

/**
 * Goal Linker Component - Links interventions to specific goals
 */
export const GoalLinker = {
  /**
   * Open the goal linking modal for an intervention
   * @param {string} rowId - ID of the intervention row
   * @param {Function} onUpdate - Callback when goals are linked
   * @param {Object} currentGoals - Currently linked goals
   * @param {Object} availableGoals - All available goals from case
   */
  openModal(rowId, onUpdate, currentGoals = [], availableGoals = {}) {
    const modal = this.createModal(rowId, onUpdate, currentGoals, availableGoals);
    document.body.append(modal);
    
    // Focus on modal
    setTimeout(() => {
      const firstCheckbox = modal.querySelector('input[type="checkbox"]');
      if (firstCheckbox) firstCheckbox.focus();
    }, 100);
  },

  /**
   * Create the goal linking modal
   */
  createModal(rowId, onUpdate, currentGoals, availableGoals) {
    const modal = el('div', {
      class: 'goal-linker-modal',
      onclick: (e) => {
        if (e.target === modal) modal.remove();
      }
    });

    const content = el('div', { class: 'goal-linker-content' });
    
    // Header
    const header = el('div', { class: 'goal-linker-header' });
    header.append(
      el('h3', {}, 'Link Goals to Intervention'),
      el('button', {
        class: 'close-btn',
        onclick: () => modal.remove()
      }, createIcon('close'))
    );

    // Extract goals from different sections
    const goalSections = this.extractGoalsFromCase(availableGoals);
    
    // Goal selection area
    const goalList = el('div', { class: 'goal-selection-list' });
    
    if (goalSections.length === 0) {
      goalList.append(
        el('div', { class: 'no-goals-message' },
          el('p', {}, 'No goals found in this case.'),
          el('button', {
            class: 'create-goal-btn',
            onclick: () => this.navigateToGoals(modal)
          }, '+ Create Goals First')
        )
      );
    } else {
      goalSections.forEach(section => {
        if (section.goals.length > 0) {
          goalList.append(
            el('h4', { class: 'goal-section-title' }, section.title),
            ...section.goals.map(goal => this.createGoalCheckbox(goal, currentGoals))
          );
        }
      });
    }

    // Action buttons
  const actions = el('div', { class: 'goal-linker-actions' });
    actions.append(
      el('button', {
    class: 'btn secondary',
        onclick: () => modal.remove()
      }, 'Cancel'),
      el('button', {
    class: 'btn primary',
        onclick: () => this.saveLinkedGoals(modal, rowId, onUpdate)
      }, 'Link Selected Goals')
    );

    content.append(header, goalList, actions);
    modal.append(content);
    
    return modal;
  },

  /**
   * Extract goals from different sections of the case
   */
  extractGoalsFromCase(availableGoals) {
    const sections = [];
    
    // Patient goals from subjective section
    if (availableGoals.subjective?.patientGoals) {
      const patientGoals = this.parseGoalsText(availableGoals.subjective.patientGoals, 'patient');
      if (patientGoals.length > 0) {
        sections.push({
          title: 'Patient Goals & Expectations',
          goals: patientGoals
        });
      }
    }

    // SMART goals from goals section
    if (availableGoals.goals) {
      const smartGoals = this.parseGoalsText(availableGoals.goals, 'smart');
      if (smartGoals.length > 0) {
        sections.push({
          title: 'SMART Goals',
          goals: smartGoals
        });
      }
    }

    // Treatment goals from plan section
    if (availableGoals.plan?.shortTermGoals) {
      const shortTermGoals = this.parseGoalsText(availableGoals.plan.shortTermGoals, 'short-term');
      if (shortTermGoals.length > 0) {
        sections.push({
          title: 'Short-Term Goals',
          goals: shortTermGoals
        });
      }
    }

    if (availableGoals.plan?.longTermGoals) {
      const longTermGoals = this.parseGoalsText(availableGoals.plan.longTermGoals, 'long-term');
      if (longTermGoals.length > 0) {
        sections.push({
          title: 'Long-Term Goals',
          goals: longTermGoals
        });
      }
    }

    return sections;
  },

  /**
   * Parse goals text into individual goal objects
   */
  parseGoalsText(text, type) {
    if (!text || text.trim() === '') return [];
    
    // Split by common delimiters and filter empty lines
    const lines = text.split(/[\n\r•-]/)
      .map(line => line.trim())
      .filter(line => line.length > 10); // Minimum length for a meaningful goal
    
    return lines.map((line, index) => ({
      id: `${type}-${index}`,
      type: type,
      text: line,
      label: this.truncateGoalText(line)
    }));
  },

  /**
   * Truncate goal text for display in chips
   */
  truncateGoalText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Create checkbox for goal selection
   */
  createGoalCheckbox(goal, currentGoals) {
    const isSelected = currentGoals.some(g => g.id === goal.id);
    
    const checkbox = el('label', { class: 'goal-checkbox-label' });
    
    const input = el('input', {
      type: 'checkbox',
      checked: isSelected,
      'data-goal-id': goal.id,
      'data-goal-type': goal.type,
      'data-goal-text': goal.text,
      'data-goal-label': goal.label
    });

    const text = el('span', { class: 'goal-text' }, goal.text);
    
    checkbox.append(input, text);
    return checkbox;
  },

  /**
   * Save the linked goals and update the intervention
   */
  saveLinkedGoals(modal, rowId, onUpdate) {
    const checkedBoxes = modal.querySelectorAll('input[type="checkbox"]:checked');
    
    const linkedGoals = Array.from(checkedBoxes).map(checkbox => ({
      id: checkbox.dataset.goalId,
      type: checkbox.dataset.goalType,
      text: checkbox.dataset.goalText,
      label: checkbox.dataset.goalLabel
    }));

    onUpdate(rowId, linkedGoals);
    modal.remove();
  },

  /**
   * Navigate to goals section to create goals
   */
  navigateToGoals(modal) {
    modal.remove();
    
    // Navigate to goals tab
    const goalsTab = document.querySelector('[data-section="goals"]');
    if (goalsTab) {
      goalsTab.click();
      
      // Focus on goals textarea after navigation
      setTimeout(() => {
        const goalsTextarea = document.querySelector('textarea[placeholder*="goals"], textarea[placeholder*="Goals"]');
        if (goalsTextarea) {
          goalsTextarea.focus();
          goalsTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  },

  /**
   * Jump to a specific goal in the interface
   */
  jumpToGoal(goalId, goalType) {
    let targetSection = 'goals';
    
    // Determine which section the goal is in
    if (goalType === 'patient') targetSection = 'subjective';
    else if (goalType === 'short-term' || goalType === 'long-term') targetSection = 'plan';
    
    // Navigate to the section
    const sectionTab = document.querySelector(`[data-section="${targetSection}"]`);
    if (sectionTab) {
      sectionTab.click();
      
      // Highlight the goal text after navigation
      setTimeout(() => {
        this.highlightGoalInSection(goalId, goalType);
      }, 200);
    }
  },

  /**
   * Highlight a specific goal in its section
   */
  highlightGoalInSection(goalId, goalType) {
    let selector = 'textarea';
    
    // Find the appropriate textarea based on goal type
    if (goalType === 'patient') {
      selector = 'textarea[placeholder*="patient"], textarea[placeholder*="Patient"]';
    } else if (goalType === 'short-term') {
      selector = 'textarea[placeholder*="short"], textarea[placeholder*="Short"]';
    } else if (goalType === 'long-term') {
      selector = 'textarea[placeholder*="long"], textarea[placeholder*="Long"]';
    }
    
    const textarea = document.querySelector(selector);
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight effect
      textarea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
      setTimeout(() => {
        textarea.style.boxShadow = '';
      }, 2000);
    }
  }
};

// Global functions for use in other modules
window.openGoalLinker = function(rowId) {
  // Get current case data
  const currentCase = window.currentDraft || {};
  
  // Get current linked goals for this intervention
  const interventions = currentCase.plan?.interventions || [];
  const intervention = interventions.find(i => i.id === rowId);
  const currentGoals = intervention?.linkedGoals || [];
  
  // Available goals from the entire case
  const availableGoals = {
    subjective: currentCase.subjective || {},
    goals: currentCase.goals || '',
    plan: currentCase.plan || {}
  };
  
  // Update function
  const onUpdate = (updatedRowId, linkedGoals) => {
    // Find and update the intervention
    const interventionIndex = interventions.findIndex(i => i.id === updatedRowId);
    if (interventionIndex >= 0) {
      interventions[interventionIndex].linkedGoals = linkedGoals;
      
      // Trigger save
      if (window.saveDraft) window.saveDraft();
      
      // Refresh the intervention card display
      if (window.refreshInterventionCard) {
        window.refreshInterventionCard(updatedRowId);
      }
    }
  };
  
  GoalLinker.openModal(rowId, onUpdate, currentGoals, availableGoals);
};

window.jumpToGoal = function(goalId) {
  const [goalType] = goalId.split('-');
  GoalLinker.jumpToGoal(goalId, goalType);
};
