module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    //Configure grunt-replace
    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: 'YOUR_API_KEY',
              replacement: process.env.GOOGLE_MAPS_KEY
            }
          ]
        },
        files: [
          { 
            expand: true, 
            flatten: true, 
            src: ['index.html', 'restaurant.html'], 
            dest: 'build/' 
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
            src: ['**', '!*.html', '!**/build/**', '!**/node_modules/**', '!*.json', '!*.md', '!gruntfile.js', '!**/img/**', 'manifest.json'],
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
            src: '*.png',
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
              quality: 50,
            },
            {
              name: 'med-details',
              width: 337,
              quality: 50,
            },
            {
              name: 'large-details',
              width: 425,
              quality: 100,
            }
          ]
        },
        files: [{
          expand: true,
          src: '*.jpg',
          cwd: 'img/',
          dest: 'build/images/'
        }]
      }
    }

  });
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.registerTask('default', ['replace', 'responsive_images', 'copy']);
}

