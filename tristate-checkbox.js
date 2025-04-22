/**********************************************************************************
 **
 **              Tristate Checkbox
 **              version: 2.0.0
 **
 **              Dual licensed under the MIT and GPL licenses:
 **              http://www.opensource.org/licenses/mit-license.php
 **              http://www.gnu.org/licenses/gpl.html
 **
 **              author: Jeff Leombruno
 **              creation date: 09.20.2011
 **              updated: April 18, 2025
 **              dependencies: None (Vanilla JavaScript)
 **
 **********************************************************************************/

class TristateCheckbox {
  /**
   * Create a tristate checkbox component
   * @param {string|Element|NodeList} selector - CSS selector, DOM element, or NodeList
   */
  constructor(selector) {
    // Store references to all root elements
    this.roots = this._getElements(selector);
    
    if (!this.roots.length) {
      console.error('TristateCheckbox: No elements found with the provided selector');
      return;
    }
    
    // Store event handler references for potential cleanup
    this._handlers = new Map();
    
    // Initialize
    this._init();
  }
  
  /**
   * Initialize the component
   * @private
   */
  _init() {
    this.roots.forEach(root => {
      // Find all checkboxes within each root
      const checkboxes = root.querySelectorAll('input[type="checkbox"]');
      
      checkboxes.forEach(checkbox => {
        // Create and store a handler for each checkbox
        const handler = this._createChangeHandler(checkbox);
        this._handlers.set(checkbox, handler);
        
        // Add event listener
        checkbox.addEventListener('change', handler);
      });
      
      // Initialize the state
      this._initializeState(root);
    });
  }
  
  /**
   * Set initial states when the page loads
   * @private
   */
  _initializeState(root) {
    // Process the tree from bottom to top to ensure proper indeterminate state
    // We need to find the deepest checkboxes first and work our way up
    
    // Get all ul elements, sort by their nesting level (deepest first)
    const allUls = Array.from(root.querySelectorAll('ul'));
    const sortedUls = allUls.sort((a, b) => {
      // Count parents to determine depth
      const depthA = this._getElementDepth(a);
      const depthB = this._getElementDepth(b);
      return depthB - depthA; // Deepest first
    });
    
    // Process each ul level, starting from the deepest
    sortedUls.forEach(ul => {
      // Get all checkboxes that are direct children of this ul's li children
      const parentCheckboxes = Array.from(ul.parentElement.querySelectorAll(':scope > input[type="checkbox"]'));
      
      // Update each parent at this level
      parentCheckboxes.forEach(checkbox => {
        this._updateParentState(checkbox);
      });
    });
  }
  
  /**
   * Helper to get the nesting depth of an element
   * @private
   */
  _getElementDepth(element) {
    let depth = 0;
    let current = element;
    
    while (current.parentElement) {
      depth++;
      current = current.parentElement;
    }
    
    return depth;
  }
  
  /**
   * Create change handler for a checkbox
   * @private
   */
  _createChangeHandler(checkbox) {
    return () => {
      // Get the state that was just set by the user
      const isChecked = checkbox.checked;
      
      // Set all children to the same state
      this._setChildCheckboxes(checkbox, isChecked);
      
      // Update parent checkboxes if any
      this._updateAncestorCheckboxes(checkbox);
    };
  }
  
  /**
   * Set all child checkboxes to the given state
   * @private
   */
  _setChildCheckboxes(parentCheckbox, isChecked) {
    // Find the UL element that's a child of the parent checkbox's LI container
    const li = parentCheckbox.closest('li');
    if (!li) return;
    
    const ul = li.querySelector('ul');
    if (!ul) return;
    
    // Set all checkboxes in this subtree
    const childCheckboxes = ul.querySelectorAll('input[type="checkbox"]');
    childCheckboxes.forEach(checkbox => {
      checkbox.checked = isChecked;
      checkbox.indeterminate = false;
    });
  }
  
  /**
   * Update the state of all ancestor checkboxes
   * @private
   */
  _updateAncestorCheckboxes(checkbox) {
    let currentCheckbox = checkbox;
    let parent;
    
    // Walk up the DOM tree
    while (parent = this._findParentCheckbox(currentCheckbox)) {
      this._updateParentState(parent);
      currentCheckbox = parent;
    }
  }
  
  /**
   * Update a single parent checkbox based on its children's state
   * @private
   */
  _updateParentState(parentCheckbox) {
    // Find immediate child checkboxes
    const childCheckboxes = this._findChildCheckboxes(parentCheckbox);
    if (!childCheckboxes.length) return;
    
    // Count checked and indeterminate children
    let checkedCount = 0;
    let indeterminateCount = 0;
    
    childCheckboxes.forEach(checkbox => {
      if (checkbox.indeterminate) {
        indeterminateCount++;
      } else if (checkbox.checked) {
        checkedCount++;
      }
    });
    
    // Set parent state based on children
    if (indeterminateCount > 0 || (checkedCount > 0 && checkedCount < childCheckboxes.length)) {
      // Some but not all children are checked, or at least one child is indeterminate
      parentCheckbox.indeterminate = true;
      parentCheckbox.checked = false;
    } else if (checkedCount === childCheckboxes.length) {
      // All children are checked
      parentCheckbox.indeterminate = false;
      parentCheckbox.checked = true;
    } else {
      // No children are checked
      parentCheckbox.indeterminate = false;
      parentCheckbox.checked = false;
    }
  }
  
  /**
   * Find the parent checkbox of a given checkbox
   * @private
   */
  _findParentCheckbox(checkbox) {
    // Get the LI that contains this checkbox
    const li = checkbox.closest('li');
    if (!li) return null;
    
    // Find the parent LI (which contains the parent checkbox)
    const parentLi = li.parentElement?.closest('li');
    if (!parentLi) return null;
    
    // Get the checkbox in the parent LI
    return parentLi.querySelector(':scope > input[type="checkbox"]');
  }
  
  /**
   * Find all immediate child checkboxes of a parent
   * @private
   */
  _findChildCheckboxes(parentCheckbox) {
    // Get the LI containing this checkbox
    const li = parentCheckbox.closest('li');
    if (!li) return [];
    
    // Get the UL that contains the children
    const ul = li.querySelector(':scope > ul');
    if (!ul) return [];
    
    // Get all immediate child checkboxes (not descendants deeper in the tree)
    return Array.from(ul.querySelectorAll(':scope > li > input[type="checkbox"]'));
  }
  
  /**
   * Clean up event listeners
   */
  destroy() {
    this._handlers.forEach((handler, checkbox) => {
      checkbox.removeEventListener('change', handler);
    });
    this._handlers.clear();
  }
  
  /**
   * Convert various selector types to array of elements
   * @private
   */
  _getElements(selector) {
    if (typeof selector === 'string') {
      return Array.from(document.querySelectorAll(selector));
    } else if (selector instanceof Element) {
      return [selector];
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
      return Array.from(selector);
    }
    return [];
  }
}

// Export as module for modern environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TristateCheckbox;
}

// Make available in the global scope
if (typeof window !== 'undefined') {
  window.TristateCheckbox = TristateCheckbox;
}