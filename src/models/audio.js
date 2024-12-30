const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Audio extends Model {
    static associate(models) {
      // define associations here if needed
    }
  }
  Audio.init({
    id: {
      type: DataTypes.STRING(8),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    game: {
      type: DataTypes.STRING
    },
    filePath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_path'
    },
    samplingRate: {
      type: DataTypes.INTEGER,
      field: 'sampling_rate'
    },
    duration: {
      type: DataTypes.FLOAT
    },
    bitrate: {
      type: DataTypes.INTEGER
    },
    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size'
    },
    startLoop: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'start_loop'
    },
    endLoop: {
      type: DataTypes.INTEGER,
      field: 'end_loop'
    }
  }, {
    sequelize,
    modelName: 'Audio',
    tableName: 'audio_tracks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Audio;
};
