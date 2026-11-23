# RunSum backend

Backend for https://runsum.harrylons.com

Athlete records and Strava tokens are stored in a local SQLite database at `db/runsum.sqlite`. The API creates the file and tables on startup. Existing Oracle data is not imported.

```pip install -r requirements.txt```

dev:
```python3 main.py```

prod command i used to use on raspberry pi (deprecated since moving to vercel)
```gunicorn -w [\$numcores] -b 0.0.0.0:[\$port] main:app```

Contact me with questions!
