const express = require('express');
const artistsRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||'database.sqlite');

artistsRouter.param('artistId', (req, res, next, artistId) => {
    db.get(`select *
            from main.Artist
            where Artist.id = $artistId`,
        {$artistId: artistId}, (err, artist) => {
            if (err) {
                next(err);
            } else if (artist) {
                req.artist = artist;
                next();
            } else {
                res.sendStatus(404);
            }
        });
});

artistsRouter.get('/', (req, res, next) => {
    db.all(`select * from Artist where Artist.is_currently_employed = 1`,
        (err, artists) => {
            if (err) {
                next(err);
            } else {
                res.status(200).json({artists: artists})
            }
    });
});

artistsRouter.get('/:artistId', ((req, res, next) => {
    res.status(200).json({artist: req.artist});
}))

module.exports = artistsRouter;
