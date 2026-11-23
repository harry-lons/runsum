CREATE TABLE IF NOT EXISTS athlete (
  StravaAthleteID INTEGER NOT NULL PRIMARY KEY,
  firstname TEXT,
  lastname TEXT,
  firstlogin TIMESTAMP,
  lastlogin TIMESTAMP,
  access_token TEXT,
  ref_token TEXT,
  exp_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS queries (
  athlete_id INTEGER NOT NULL,
  querytime TIMESTAMP,
  startdate TIMESTAMP,
  enddate TIMESTAMP
);
