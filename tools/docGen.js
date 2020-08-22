const { join } = require('path');
const { Application, TSConfigReader } = require('typedoc');

const typedocApp = new Application();

// Set typedoc options
typedocApp.options.addReader(new TSConfigReader()); // Necessary since we specify the tsconfig option below
typedocApp.bootstrap({
    name: 'RSGBot',
    theme: 'default',
    mode: 'modules', // https://typedoc.org/guides/options/#mode
    excludePrivate: true, // Exclude private members
    includeDeclarations: false, // Exclude .d.ts files
    excludeExternals: true, // Exclude files in node_modules
    tsconfig: join(__dirname, '../tsconfig.json') // TS options used when compiling .ts files
});

// Input files
const inputFiles = typedocApp.expandInputFiles([join(__dirname, '../src')]); // Recursively searches for .ts files in src directory
console.log(`Generating documentation for:\n\n${inputFiles.join('\n')}`);

// Run
typedocApp.generateDocs(inputFiles, join(__dirname, '../docs'));