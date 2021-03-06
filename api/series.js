const express = require('express');
const seriesRouter = express.Router();
const issuesRouter = require('./issue')

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||'database.sqlite');

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get(`select *
            from Series
            where Series.id = $seriesId`,
        {$seriesId: seriesId}, (err, series) => {
            if (err) {
                next(err);
            } else if (series) {
                req.series = series;
                next();
            } else {
                res.sendStatus(404)
            }
        });
});

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/', ((req, res, next) => {
    db.all(`select *
            from Series`, (err, series) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({series: series});
        }
    });
}));

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({series: req.series});
});

seriesRouter.post('/', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;
    if (!name || !description) {
        return res.sendStatus(400);
    }

    const sql = `insert into Series (name, description)
                 values ($name, $description);
    `
    const values = {
        $name: name,
        $description: description
    }

    db.run(sql, values, function (err) {
        if (err) {
            next(err);
        } else {
            db.get(`select * from Series where id = ${this.lastID}`, (err, series) => {
                res.status(201).json({series: series});
            });
        }
    });
});

seriesRouter.put('/:seriesId', ((req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;
    const seriesId = req.params.seriesId;
    if (!name || !description) {
        return res.sendStatus(400);
    }

    const sql = `update Series
                 set name        = $name,
                     description = $description
                 where id = $seriesId;
    `;
    const values = {
        $name: name,
        $description: description,
        $seriesId: seriesId
    }

    db.run(sql, values, (err) => {
        if (err) {
            next(err);
        } else {
            db.get(`select * from Series where id = ${seriesId}`, (err, series) => {
                res.status(200).json({series: series});
            });
        }
    });
}));

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const issueSql = 'select * from Issue where issue.series_id = $seriesId',
        issueValues = {$seriesId: req.params.seriesId};
    db.get(issueSql, issueValues, (err, issues) => {
        if (err) {
            nest(err);
        } else if (issues) {
            res.sendStatus(400);
        } else {
            const deleteSql = 'delete from Series where id = $seriesId',
                deleteValues = {$seriesId: req.params.seriesId};
            db.run(deleteSql, deleteValues, (err) => {
                if (err) {
                    next(err);
                } else {
                    res.sendStatus(204);
                }
            });
        }
    });
});

module.exports = seriesRouter;