#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Helper functions to format console output
function logSuccess(message) {
  console.log(`\x1b[32m✓ ${message}\x1b[0m`);
}

function logWarning(message) {
  console.log(`\x1b[33m${message}\x1b[0m`);
}

function logError(message) {
  console.log(`\x1b[31m${message}\x1b[0m`);
}

// File paths
const SCRATCH_DEF_FILE = path.resolve('config/project-scratch-def.json');
const PRE_DEPLOY_DIR = path.resolve('metadata/pre/npsp-dependencies');
const ENABLE_MULTI_CURRENCY_SCRIPT = path.resolve('scripts/node/enable_multi_currency.js');

const packages = {
  'Contacts & Organizations': '04t80000000gYcfAAE',
  'Household': '04t80000000jYrOAAU',
  'Affiliations': '04t80000001AVBMAA4',
  'Relationships': '04t80000000tpCGAAY',
  'Recurring Donations': '04t80000000tpCBAAY',
  'Nonprofit Success Pack': '04t1Y000001I8yUQAS'
};

function runCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    logError(`${errorMessage}`);
    console.error(error.message);
    process.exit(1);
  }
}

function main(scratchOrgAlias, devHubAlias) {
  if (!scratchOrgAlias || !devHubAlias) {
    logWarning('Error: Scratch org alias and Dev Hub alias must be provided.');
    console.error('Usage: create-scratch-npsp <ScratchOrgAlias> <DevHubAlias>');
    process.exit(1);
  }

  logSuccess('Creating scratch org');
  runCommand(
    `sf org create scratch --definition-file ${SCRATCH_DEF_FILE} --alias ${scratchOrgAlias} --set-default --target-dev-hub ${devHubAlias} --no-namespace --duration-days 30`,
    'Failed to create scratch org'
  );

  logSuccess(`Scratch org created with alias: ${scratchOrgAlias}`);

  logSuccess('Deploying pre-dependency for NPSP packages');
  runCommand(
    `sf project deploy start --source-dir ${PRE_DEPLOY_DIR} --target-org ${scratchOrgAlias}`,
    'Failed to deploy pre-dependency'
  );

  logSuccess('Starting Installation of NPSP Packages');
  
  for (const [packageName, packageId] of Object.entries(packages)) {
    logSuccess(`Installing ${packageName} with version ID ${packageId}`);
    runCommand(
      `sf package install --package ${packageId} --target-org ${scratchOrgAlias} --wait 15 --no-prompt`,
      `Failed to install ${packageName}`
    );
  }

  logSuccess('Enabling Multicurrency and Advanced Currency Management');
  logSuccess('Executing enable_multi_currency.js script');
  runCommand(
    `node ${ENABLE_MULTI_CURRENCY_SCRIPT} ${scratchOrgAlias}`,
    'Failed to execute enable_multi_currency.js script'
  );

  logSuccess('Completed enable_multi_currency.js script execution');
}

if (process.argv.length !== 4) {
  logWarning('Usage: create-scratch-npsp <ScratchOrgAlias> <DevHubAlias>');
  process.exit(1);
}

main(process.argv[2], process.argv[3]);