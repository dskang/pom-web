module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pom: {
      app: 'client',
      dist: 'public'
    },

    // TODO: use rev for cache busting
    rev: {
      assets: {
        files: {
          src: ['<%= pom.dist %>/js/*.js']
        }
      }
    },

    useminPrepare: {
      html: '<%= pom.app %>/chat.html',
      options: {
        dest: '<%= pom.dist %>'
      }
    },

    usemin: {
      html: '<%= pom.dist %>/chat.html'
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
          cwd: '<%= pom.app %>',
          dest: '<%= pom.dist %>',
          src: [
            'audio/*',
            'css/*',
            'img/*',
            '*.html'
          ]
        }]
      }
    },

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= pom.dist %>/*'
          ]
        }]
      }
    },

    watch: {
      client: {
        files: '<%= pom.app %>/{,*/}*',
        tasks: 'default'
      }
    }

  });

  grunt.registerTask('default', [
    'clean:dist',
    'useminPrepare',
    'concat',
    'ngmin',
    'copy:dist',
    'uglify',
    'usemin'
  ]);

  grunt.registerTask('dev', [
    'default',
    'watch'
  ]);

};
