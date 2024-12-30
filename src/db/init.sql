CREATE TABLE IF NOT EXISTS audio_tracks (
    id VARCHAR(8) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    game VARCHAR(255),
    file_path TEXT NOT NULL,
    sampling_rate INTEGER,
    duration FLOAT,
    bitrate INTEGER,
    file_size BIGINT,
    start_loop INTEGER DEFAULT 0,
    end_loop INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
