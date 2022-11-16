CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(20) NOT NULL,
    password    VARCHAR(20) NOT NULL
);
