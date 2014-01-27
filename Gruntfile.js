module.exports = function(grunt) {

  grunt.initConfig({
    // TODO: use rev for cache busting
    rev: {
      assets: {
        files: {
          src: ['public/js/*.js']
        }
      }
    }, 

    useminPrepare: {
      html: 'client/chat.html',
      options: {
        dest: 'public'
      }
    },

    usemin: {
      html: 'public/chat.html'
    },

    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/js',
          src: '*.js',
          dest: '.tmp/concat/js'
        }]
      }
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'client',
          dest: 'public',
          src: [
            'audio/*',
            'css/*',
            'img/*',
            '*.html'
          ]
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', [
    'useminPrepare',
    'concat',
    'ngmin',
    'copy:dist',
    'uglify',
    'usemin'
  ]);

};
