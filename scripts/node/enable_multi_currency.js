#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
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
const MULTI_CURRENCY_FILE = path.resolve('metadata/post/MultiCurrency/Currency.settings-meta.xml');
const CURRENCY_EFFECTIVE_DATES_FILE = path.resolve('metadata/post/CurrencyEffectiveDates/Currency.settings-meta.xml');
const JSON_FILE = path.resolve('data/CurrencyTypes.json');

function runCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    logError(`${errorMessage}`);
    console.error(error.message);
    process.exit(1);
  }
}

function main(orgAlias) {
  if (!orgAlias) {
    logWarning('Usage: enable_multi_currency <OrgAlias>');
    process.exit(1);
  }

  [MULTI_CURRENCY_FILE, CURRENCY_EFFECTIVE_DATES_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
      logError(`Error: ${file} does not exist.`);
      process.exit(1);
    }
  });

  logSuccess(`Deploying currency settings to ${orgAlias}...`);
  runCommand(
    `sf project deploy start --source-dir ${MULTI_CURRENCY_FILE} --target-org ${orgAlias}`,
    `Failed to deploy ${MULTI_CURRENCY_FILE}`
  );
  runCommand(
    `sf project deploy start --source-dir ${CURRENCY_EFFECTIVE_DATES_FILE} --target-org ${orgAlias}`,
    `Failed to deploy ${CURRENCY_EFFECTIVE_DATES_FILE}`
  );

  logSuccess('Deployment complete.');

  if (!fs.existsSync(JSON_FILE)) {
    logError(`Error: ${JSON_FILE} does not exist.`);
    process.exit(1);
  }

  logSuccess(`Importing currencies from ${JSON_FILE} to ${orgAlias}...`);
  runCommand(
    `sf data import tree --files ${JSON_FILE} --target-org ${orgAlias}`,
    `Failed to import currencies from ${JSON_FILE}`
  );

  logSuccess('Currency import complete.');
}

if (process.argv.length !== 3) {
  logWarning('Usage: enable_multi_currency <OrgAlias>');
  process.exit(1);
}

main(process.argv[2]);
