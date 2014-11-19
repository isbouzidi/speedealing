"use strict";

module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            js: {
                files: ['public/js/**', 'app/**/*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            html: {
                files: ['public/views/**', 'app/views/**'],
                options: {
                    livereload: true
                }
            },
            css: {
                files: ['public/css/**'],
                options: {
                    livereload: true
                }
            }
        },
        jshint: {
            all: ['gruntfile.js', 'server.js', 'public/js/speedealing/**/*.js', 'config/**/*.js', 'app/**/*.js'],
            options: {
                jshintrc: '.jshintrc'
                }
        },
        nodemon: {
            dev: {
                options: {
                    file: 'server.js',
                    args: [],
                    ignoredFiles: ['README.md', 'node_modules/**', '.DS_Store'],
                    watchedExtensions: ['js'],
                    watchedFolders: ['app', 'config'],
                    debug: true,
                    delayTime: 1,
                    env: {
                        PORT: 3000
                    },
                    cwd: __dirname
                }
            }
        },
        concurrent: {
            tasks: ['nodemon', 'watch'], 
            options: {
                logConcurrentOutput: true
            }
        },
        mochaTest: {
            options: {
                reporter: 'spec'
            },
            src: ['test/**/*.js']
        },
        env: {
            test: {
                NODE_ENV: 'test'
            }
        },
        // Validate against jQuery coding standard
        jscs: {
        	all: {
        		options: {
                    "standard": "Jquery",
                    "reportFull": true,
                    "reportFile": "/home/travis/build/symeos/speedealing/nodejs/jscsReport.txt"
                },
                files: {
                    src: [
                          'gruntfile.js',
                          'server.js',
                          'config/',
                          'app/controllers/',
                          'app/models/',
                          'app/routes/',
                          'public/js/speedealing/',
                          'public/js/speedealing/controllers/',
                          'public/js/speedealing/services/'
                          ]
                }
            }
        },
        jsonlint: {
            sample: {
                src: [ 
                    'bower.json',
                    'package.json',
                    'config/**/*.json',
                    'locales/**/*.json'
                    ]
            }
        }
    });

    //Load NPM tasks 
    grunt.loadNpmTasks('grunt-contrib-jscs');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-env');

    //Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    //Default task(s).
    grunt.registerTask('default', ['jshint', 'concurrent']);

    //Test task.
    //grunt.registerTask('test', ['env:test', 'mochaTest', 'jscs']);
    grunt.registerTask('test', ['env:test', 'mochaTest', 'jsonlint', 'jshint']);
};
