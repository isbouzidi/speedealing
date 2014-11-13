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
            all: ['gruntfile.js', 'public/js/**/*.js', 'test/**/*.js', 'app/**/*.js']
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
                    "standard": "Jquery"
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
        }
    });

    //Load NPM tasks 
    grunt.loadNpmTasks('grunt-contrib-jscs');
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
    grunt.registerTask('test', ['env:test', 'mochaTest', 'jscs']);
};
