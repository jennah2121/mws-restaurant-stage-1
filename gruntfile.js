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
          { expand: true, flatten: true, src: ['index.html', 'restaurant.html'], dest: 'build/' }
        ]
      }
    },
    //Configure grunt-contrib-copy
    copy: {
      build: {
        files:[
          //Copy all folders and files needed to run the project locally
          {
            expand: true, 
            cwd: __dirname, 
            src: ['**', '!*.html', '!**/build/**', '!**/node_modules/**', '!*.json', '!*.md', '!gruntfile.js'], 
            dest: 'build/'
          }
        ]
      }

    }
  });
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['copy', 'replace']);
}

console.log('I am located here: ', __dirname);
