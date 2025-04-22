/**
 * Performance benchmark for Tristate Checkbox
 * 
 * Measures:
 * 1. Initialization time (with small, medium, and large DOM structures)
 * 2. Update propagation time (checking/unchecking operations)
 */

const microtime = require('microtime');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Use a more direct approach - require the module directly
const TristateCheckbox = require('../tristate-checkbox');

console.log('==================================================');
console.log('Tristate Checkbox Performance Benchmark');
console.log('==================================================');

// Create a more complex DOM environment for testing with multiple checkbox hierarchies
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <!-- Small hierarchy -->
  <ul id="small-tree">
    <li>
      <input type="checkbox" id="small-parent-checkbox">
      <span>Parent</span>
      <ul>
        <li>
          <input type="checkbox" id="small-child1-checkbox">
          <span>Child 1</span>
        </li>
        <li>
          <input type="checkbox" id="small-child2-checkbox">
          <span>Child 2</span>
        </li>
      </ul>
    </li>
  </ul>
  
  <!-- Medium hierarchy -->
  <ul id="medium-tree">
    <li>
      <input type="checkbox" id="medium-parent-checkbox">
      <span>Parent</span>
      <ul>
        <li>
          <input type="checkbox" id="medium-child1-checkbox">
          <span>Child 1</span>
          <ul>
            <li>
              <input type="checkbox" id="medium-grandchild1-checkbox">
              <span>Grandchild 1</span>
            </li>
            <li>
              <input type="checkbox" id="medium-grandchild2-checkbox">
              <span>Grandchild 2</span>
            </li>
          </ul>
        </li>
        <li>
          <input type="checkbox" id="medium-child2-checkbox">
          <span>Child 2</span>
          <ul>
            <li>
              <input type="checkbox" id="medium-grandchild3-checkbox">
              <span>Grandchild 3</span>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
  
  <!-- Large hierarchy (generated programmatically) -->
  <ul id="large-tree"></ul>
</body>
</html>
`);

// Make DOM elements available globally
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.Element = dom.window.Element; // Add Element reference to fix "Element is not defined" error
global.NodeList = dom.window.NodeList; // Add NodeList reference

// Generate a large tree for more intensive benchmark
function generateLargeTree() {
  const largeTree = document.getElementById('large-tree');
  const depth = 5;
  const childrenPerNode = 3;
  
  function createNestedList(depth, parentElement, prefix = '') {
    if (depth === 0) return;
    
    const ul = document.createElement('ul');
    parentElement.appendChild(ul);
    
    for (let i = 1; i <= childrenPerNode; i++) {
      const li = document.createElement('li');
      ul.appendChild(li);
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${prefix}checkbox-${depth}-${i}`;
      li.appendChild(checkbox);
      
      const span = document.createElement('span');
      span.textContent = `Level ${depth} - Item ${i}`;
      li.appendChild(span);
      
      // Create nested structure
      createNestedList(depth - 1, li, `${prefix}${i}-`);
    }
  }
  
  const rootLi = document.createElement('li');
  largeTree.appendChild(rootLi);
  
  const rootCheckbox = document.createElement('input');
  rootCheckbox.type = 'checkbox';
  rootCheckbox.id = 'large-root-checkbox';
  rootLi.appendChild(rootCheckbox);
  
  const rootSpan = document.createElement('span');
  rootSpan.textContent = 'Large Tree Root';
  rootLi.appendChild(rootSpan);
  
  createNestedList(depth, rootLi, 'large-');
}

console.log('Generating large checkbox hierarchy for benchmarking...');
generateLargeTree();

// Count how many checkboxes we generated for reference
const totalCheckboxes = document.querySelectorAll('input[type="checkbox"]').length;
console.log(`Total checkboxes in test environment: ${totalCheckboxes}`);

// Test if TristateCheckbox loaded successfully
if (!TristateCheckbox) {
  console.error('Failed to load TristateCheckbox class');
  process.exit(1);
}

console.log('TristateCheckbox class loaded successfully');

// Setup test elements
const setupTree = (treeId) => {
  const tree = document.getElementById(treeId);
  const checkboxes = tree.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    checkbox.indeterminate = false;
  });
  return tree;
};

// Simple benchmarking function
function benchmark(name, fn, iterations = 1000) {
  console.log(`\nRunning benchmark: ${name}`);
  
  // Warmup
  for (let i = 0; i < 10; i++) {
    fn();
  }
  
  // Benchmark
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = microtime.now();
    fn();
    const end = microtime.now();
    times.push(end - start);
  }
  
  // Calculate statistics
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  // Sort for median and percentiles
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  
  console.log(`Results for "${name}" (${iterations} iterations):`);
  console.log(`  Average: ${(avg / 1000).toFixed(3)} ms`);
  console.log(`  Median:  ${(median / 1000).toFixed(3)} ms`);
  console.log(`  Min:     ${(min / 1000).toFixed(3)} ms`);
  console.log(`  Max:     ${(max / 1000).toFixed(3)} ms`);
  console.log(`  95th %:  ${(p95 / 1000).toFixed(3)} ms`);
  
  return { avg, median, min, max, p95 };
}

console.log('\n==== BENCHMARK RESULTS ====');

// ----- INITIALIZATION BENCHMARKS -----
console.log('\n----- Initialization Performance -----');

// Small tree initialization
benchmark('Initialize small tree', () => {
  const tree = setupTree('small-tree');
  const tristate = new TristateCheckbox(tree);
  tristate.destroy();
}, 1000);

// Medium tree initialization
benchmark('Initialize medium tree', () => {
  const tree = setupTree('medium-tree');
  const tristate = new TristateCheckbox(tree);
  tristate.destroy();
}, 1000);

// Large tree initialization
benchmark('Initialize large tree', () => {
  const tree = setupTree('large-tree');
  const tristate = new TristateCheckbox(tree);
  tristate.destroy();
}, 100); // Fewer iterations for the large tree

// ----- OPERATIONS BENCHMARKS -----
console.log('\n----- Check/Uncheck Operations Performance -----');

// Small tree operations
benchmark('Small tree check/uncheck operations', () => {
  const tree = setupTree('small-tree');
  const tristate = new TristateCheckbox(tree);
  
  const parentCheckbox = document.getElementById('small-parent-checkbox');
  const childCheckboxes = [
    document.getElementById('small-child1-checkbox'),
    document.getElementById('small-child2-checkbox')
  ];
  
  // Toggle parent
  parentCheckbox.checked = true;
  parentCheckbox.dispatchEvent(new dom.window.Event('change'));
  
  // Toggle children
  childCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.dispatchEvent(new dom.window.Event('change'));
  });
  
  tristate.destroy();
}, 1000);

// Medium tree operations
benchmark('Medium tree check/uncheck operations', () => {
  const tree = setupTree('medium-tree');
  const tristate = new TristateCheckbox(tree);
  
  const parentCheckbox = document.getElementById('medium-parent-checkbox');
  const childCheckbox = document.getElementById('medium-child1-checkbox');
  const grandchildCheckbox = document.getElementById('medium-grandchild1-checkbox');
  
  // Toggle parent
  parentCheckbox.checked = true;
  parentCheckbox.dispatchEvent(new dom.window.Event('change'));
  
  // Toggle child
  childCheckbox.checked = false;
  childCheckbox.dispatchEvent(new dom.window.Event('change'));
  
  // Toggle grandchild
  grandchildCheckbox.checked = true;
  grandchildCheckbox.dispatchEvent(new dom.window.Event('change'));
  
  tristate.destroy();
}, 1000);

// Large tree operations
benchmark('Large tree check/uncheck operations', () => {
  const tree = setupTree('large-tree');
  const tristate = new TristateCheckbox(tree);
  
  const rootCheckbox = document.getElementById('large-root-checkbox');
  
  // Toggle root checkbox (affects all checkboxes)
  rootCheckbox.checked = true;
  rootCheckbox.dispatchEvent(new dom.window.Event('change'));
  
  // Toggle some nested checkboxes
  const nestedCheckbox = document.getElementById('large-1-checkbox-3-1');
  if (nestedCheckbox) {
    nestedCheckbox.checked = false;
    nestedCheckbox.dispatchEvent(new dom.window.Event('change'));
  }
  
  tristate.destroy();
}, 100); // Fewer iterations for large tree

console.log('\n==================================================');
console.log('Benchmark completed successfully!');
console.log('==================================================');