'use strict';

// CRA/webpack-dev-server can crash with "allowedHosts[0] should be a non-empty string"
// when environment variables like HOST/WDS_SOCKET_HOST are set to empty values.
// This wrapper normalizes them to safe defaults before starting react-scripts.

const { spawn } = require('child_process');
const path = require('path');

function normalizeEnvVar(name, defaultValue) {
  const val = process.env[name];
  if (val === undefined || val === null || String(val).trim() === '') {
    process.env[name] = defaultValue;
  }
}

normalizeEnvVar('HOST', 'localhost');

// If these are set but empty, they can also break the dev server.
// We only set them if missing/empty.
normalizeEnvVar('WDS_SOCKET_HOST', 'localhost');

// Workaround for webpack-dev-server schema error:
// "options.allowedHosts[0] should be a non-empty string."
// CRA reads this flag to disable host checking (allowedHosts: 'all').
normalizeEnvVar('DANGEROUSLY_DISABLE_HOST_CHECK', 'true');

const reactScriptsStart = require.resolve('react-scripts/scripts/start');

const child = spawn(process.execPath, [reactScriptsStart], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.resolve(__dirname, '..'),
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
