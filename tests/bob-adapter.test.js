#!/usr/bin/env node
// Smoke test for the IBM Bob adapter: verify rules, custom mode, hooks,
// and skills wiring are present and consistent.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SKILL_DIRS = [
  'ponytail',
  'ponytail-review',
  'ponytail-audit',
  'ponytail-debt',
  'ponytail-gain',
  'ponytail-help',
];

function readJSON(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

test('bob rules file exists and matches AGENTS.md canonical body', () => {
  const rulesPath = path.join(root, '.bob', 'rules', 'ponytail.md');
  assert.ok(fs.existsSync(rulesPath), '.bob/rules/ponytail.md must exist');
  const content = fs.readFileSync(rulesPath, 'utf8').trim();
  assert.ok(content.length > 0, '.bob/rules/ponytail.md must not be empty');
  assert.ok(content.includes('lazy senior developer'), 'rules must contain the ponytail identity');

  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')
    .replace(/\r\n/g, '\n').trim();
  const canonical = agents.replace(/\n\n\(Yes, this file also applies[\s\S]*?\)$/, '').trim();
  const bobCopy = fs.readFileSync(rulesPath, 'utf8').replace(/\r\n/g, '\n').trim();
  assert.equal(bobCopy, canonical, '.bob/rules/ponytail.md drifted from AGENTS.md');
});

test('bob custom mode YAML file exists and contains ponytail mode configuration', () => {
  const customModesPath = path.join(root, '.bob', 'custom_modes.yaml');
  assert.ok(fs.existsSync(customModesPath), '.bob/custom_modes.yaml must exist');
  const content = fs.readFileSync(customModesPath, 'utf8');
  assert.ok(content.includes('slug: ponytail'), 'must declare slug: ponytail');
  assert.ok(content.includes('roleDefinition:'), 'must declare roleDefinition');
  assert.ok(content.includes('whenToUse:'), 'must declare whenToUse');
  assert.ok(content.includes('customInstructions:'), 'must declare customInstructions');
  assert.ok(content.includes('groups:'), 'must declare groups');
  assert.ok(content.includes('- read'), 'must include read tool group');
  assert.ok(content.includes('- edit'), 'must include edit tool group');
  assert.ok(content.includes('- command'), 'must include command tool group');
  assert.ok(content.includes('- skill'), 'must include skill tool group');
});

test('bob hooks config exists and registers UserPromptSubmit', () => {
  const hooksConfig = readJSON('hooks/bob-hooks.json');
  assert.ok(hooksConfig.hooks, 'hooks config must have a hooks key');
  assert.ok(hooksConfig.hooks.UserPromptSubmit, 'must register UserPromptSubmit hook');
  assert.ok(Array.isArray(hooksConfig.hooks.UserPromptSubmit), 'UserPromptSubmit must be an array');
  const cmd = hooksConfig.hooks.UserPromptSubmit[0].hooks[0].command;
  assert.ok(cmd.includes('ponytail-mode-tracker.js'), 'must point at ponytail-mode-tracker.js');
});

test('skills are present for bob skill discovery', () => {
  const skillsDir = path.join(root, 'skills');
  assert.ok(fs.existsSync(skillsDir), 'skills/ directory must exist');

  for (const skill of SKILL_DIRS) {
    const skillFile = path.join(skillsDir, skill, 'SKILL.md');
    assert.ok(
      fs.existsSync(skillFile),
      `missing skill: skills/${skill}/SKILL.md`,
    );
  }
});
