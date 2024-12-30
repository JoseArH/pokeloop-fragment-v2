'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audio_tracks', {
      id: {
        type: Sequelize.STRING(8),
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      game: {
        type: Sequelize.STRING
      },
      file_path: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sampling_rate: {
        type: Sequelize.INTEGER
      },
      duration: {
        type: Sequelize.FLOAT
      },
      bitrate: {
        type: Sequelize.INTEGER
      },
      file_size: {
        type: Sequelize.BIGINT
      },
      start_loop: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      end_loop: {
        type: Sequelize.INTEGER
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audio_tracks');
  }
};
