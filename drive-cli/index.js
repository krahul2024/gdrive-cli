#!/usr/bin/env node

const fs = require('fs'); 
const path = require('path'); 
const chalk = require('chalk')
const yargs = require('yargs'); 

function modeToPermissionsString(mode) {
    // mode is in octal format, we have to convert it to hex 
    const permissions = (mode & parseInt("777", 8)).toString(8);
    return permissions;
}

// this is some change just to check the commits


yargs.command({
    command : 'hi', 
    describe : 'This command prints a welcome message!', 
    builder : {
        text : {
            describe : 'Some text', 
            demandOption : true, 
            type : 'string', 
            alias : 'n'
        }
    }, 
    handler : function(argv) {
        console.log(`Welcome, ${argv.text}`)
    }
})

// Get the list of all the files 
yargs.command({
    command : 'list <dir>', 
    describe : 'List all the files in directory', 
    builder : {
        all : {
            alias : 'a', 
            describe : 'List all the files(hidden also)', 
            type : 'boolean', 
            default : false
        }
    },
    handler : function(argv){
        const dirPath = argv.dir || '.' ; 
        const listAll = argv.all ; 

        fs.readdir(dirPath, (err, files) => {
            if(err) {
                console.error('There was an eror!'); 
                return ; 
            }
            files.forEach(file => {
                if(!listAll && file.startsWith('.')) return ; 
                const filePath = path.join(dirPath, file); 

                fs.stat(filePath, (err, stats) => {
                    if(err) {
                        console.log('There was an error'); 
                        return ; 
                    }
                    if(stats.isDirectory())console.log(chalk.blue(file),'\t', (stats.size/1024).toFixed(2), 'KB', '\t', stats.mtime, modeToPermissionsString(stats.mode));
                    else console.log(file, '\t', (stats.size/1024).toFixed(2), 'KB', '\t', stats.mtime, modeToPermissionsString(stats.mode)); 
                })
            })  
        })
        
    },
    aliases : ['ls', 'l']
})

yargs.parse();
