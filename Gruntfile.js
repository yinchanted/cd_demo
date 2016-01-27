//#!/usr/bin/node

module.exports = function(grunt){
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            options: {
                force: true
            },
            dist: {
							files: {
              	src: "dist"
							}
						},
            output: ['debug']
        },

				jshint: {
					options: {
						// force: true,
						// 'W069': false // ignored jshint error.
						reporterOutput: 'jshint.txt'
					},
					files: ['./js/*.js']
				},

				htmlhint: {
					templates: {
						options: {
							'attr-lower-case': true,
							'attr-value-not-empty': true,
							'tag-pair': true,
							'tag-self-close': true,
							'tagname-lowercase': true,
							'id-class-unique': true,
							'src-not-empty':	true,
							'img-alt-required': true
						},
						src: ['index.html']
					}
				},

				csslint: {
					strict: {
						options: {
						},
						src: ['css/*.css']
					}
				},

				htmlmin: {
					dist: {
						options: {
							collapseWhitespace: true,
							conservativeCollapse: true, // used with collapseWhitespace
							removeEmptyAttributes: true,
							removeEmptyElements: true,
							removeRedundantAttributes: true,
							removeComments: true,
							removeOptionalTags: true
						},
						files: {
							'dist/index.html': ['index.html']
						}
					}
				},

				uglify: {
					options: {
						sourceMap: true,
						sourceMapIncludeSources: true,
						compress: {
							drop_console: true
						}
					},
					dist: {
						files: {
							"dist/cd_demo.min.js": ["./js/cd_demo1.js"]
						}
					}
				}

    });
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-htmlhint');

    grunt.registerTask('default', ['clean','jshint','htmlhint','csslint','htmlmin']);
};
