#!/usr/bin/env node

import 'babel-polyfill'
import program from 'commander'
import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'

let inputPath, index;
let isJsFile = /.jsx?$/;

program
    .version(require('../package').version)
    .description('Generate an exports file for a directory')
    .arguments('<path>')
    .option('-f, --filename <filename>', 'Save the exports to file [index.js]', 'index.js')
    .action(p => { inputPath = path.resolve(p) })
    .parse(process.argv);

if (!program.args.length) {
    inputPath = path.resolve('.')
}

index = `${inputPath}/${program.filename}`;

fs.lstat(index, (err, stats) => {
    if (!err && stats.isFile()) {
        fs.readFile(index, 'utf-8', (err, data) => {
            checkErr(err)

            if (!data.startsWith('export')) {
                overwrite(generateFile)
            }
            else {
                generateFile()
            }
        })
    }
    else {
        generateFile()
    }
})

function overwrite(yes) {
    inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `${program.filename} already exists and it doesn\'t look like an exports file, overwrite?`,
        default: false
    }], (answers) => {
        if (answers.overwrite) {
            yes()
        }
    })
}

function emptyFile(yes) {
    inquirer.prompt([{
        type: 'confirm',
        name: 'empty',
        message: `No .js(x) files were found, generate an empty ${program.filename}?`,
        default: false
    }], (answers) => {
        if (answers.empty) {
            yes()
        }
    })
}

function generateFile() {
    fs.readdir(inputPath, (err, dir) => {
        checkErr(err)

        let exportsFile = dir
            .filter(filename => (isJsFile.test(filename) && filename !== program.filename))
            .map(filename => {
                let name = filename.split('.').slice(0, -1).join('.')
                return `export ${name} from './${name}'`
            })
            .join('\n');

        if (exportsFile === '') {
            emptyFile(writeFile)
        }
        else {
            writeFile()
        }

        function writeFile() {
            fs.writeFile(program.filename, exportsFile + '\n', (err, result) => {
                checkErr(err)
            })
        }
    })
}

function checkErr(err) {
    if (err) {
        console.log(err)
        program.help()
    }
}
