require('env2')('./config.env');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    //Configure grunt-browserify
    browserify: {
      helper: {
        src: 'js/dbhelper.js',
        dest: 'build/js/dbhelper.js'
      },
      main: {
        src: 'js/main.js',
        dest: 'build/js/main.js'
      },
      restaurants: {
        src: 'js/restaurant_info.js',
        dest: 'build/js/restaurant_info.js'
      }
    },
    // Configure grunt-replace
    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: '<your MAPBOX API KEY HERE>',
              replacement: process.env.MAP_TOKEN
            }
          ]
        },
        files: [
          {
            expand: true,
            flatten: true,
            cwd: __dirname,
            src: ['build/js/main.js', 'build/js/restaurant_info.js'],
            dest: 'build/js'
          }
        ]
      }
    },
    //Configure grunt-contrib-copy
    copy: {
      build: {
        files: [
          //Copy all folders and files needed to run the project locally
          {
            expand: true,
            cwd: __dirname,
            src: [
              '**',
              '!**/build/**',
              '!**/node_modules/**',
              '!*.json',
              '!*.md',
              '!gruntfile.js',
              '!**/img/**',
              'manifest.json',
              '!**/data/**',
              '!dbhlper.js'
            ],
            dest: 'build/'
          }
        ]
      },
      //Copy the icon to the images folder
      icon: {
        files: [
          {
            expand: true,
            cwd: 'img/',
            src: ['*.png', '*.webp'],
            dest: 'build/images/'
          }
        ]
      }
    },
    //Configure responsive-images
    responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [
            {
              name: 'small-main',
              width: 269,
              height: 204,
              quality: 50
            },
            {
              name: 'large-main',
              width: 317,
              quality: 50
            },
            {
              name: 'small-details',
              width: 288,
              quality: 50
            },
            {
              name: 'med-details',
              width: 337,
              quality: 50
            },
            {
              name: 'large-details',
              width: 425,
              quality: 100
            }
          ]
        },
        files: [
          {
            expand: true,
            src: '*.jpg',
            cwd: 'img/',
            dest: 'build/images/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-replace');
  grunt.registerTask('default', [
    'responsive_images',
    'copy',
    'browserify',
    'replace'
  ]);
};
