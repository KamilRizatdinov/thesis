#! /usr/bin/env node

const {Command} = require('commander');
const {execFile} = require('node:child_process');
const program = new Command();

program.name('node index.js').description('CLI to manage the benchmark suite');

program
  .command('build')
  .description('Build benchmark suite')
  .argument(
    '[src]',
    'Path to benchmark suite case (e.g. "./src/cases/map-reduce/page-rank")',
    'all',
  )
  .option(
    '-b, --branch [branch]',
    'Optimization branch for build (e.g. "baseline")',
    'optimized',
  )
  .option(
    '-e, --env [environment]',
    'Environment for build (e.g. "debug")',
    'release',
  )
  .option(
    '-o, --optimize [optimization]',
    'Optimization level for build (e.g. "O3s")',
    'O3',
  )
  .action((src, options) => {
    var child = execFile(
      'sh',
      [
        `${process.env.PWD}/scripts/build.sh`,
        src,
        options.branch,
        options.env,
        options.optimize,
      ],
      (error, stdout, stderr) => {
        if (error) throw error;
      },
    );
    child.stdout.on('data', data => {
      if (data) console.log(data.toString().trim());
    });
  });

program
  .command('run')
  .description('Run benchmark suite')
  .argument(
    '[src]',
    'Path to benchmark suite case (e.g. "./src/cases/map-reduce/page-rank")',
    'all',
  )
  .option(
    '-l , --language [language]',
    'Language to run (e.g. "js"/"asc"))',
    'all',
  )
  .action((src, options) => {
    var child = execFile(
      'sh',
      [`${process.env.PWD}/scripts/run.sh`, src, options.language],
      (error, stdout, stderr) => {
        if (error) throw error;
      },
    );
    child.stdout.on('data', data => {
      if (data) console.log(data.toString().trim());
    });
  });

program.parse();
