var pool = require('./libs/db');

colors = ["0xFF4000","0xF78181","0xFF00BF","0xFA58D0","0xFA5882","0xFF0040","0xDF3A01","0xFE642E","0xFE2E2E","0xFF00FF"]
count = 0;




    pool.connect(function(err, client, done) {
                            if(err) {
                                return console.error('error fetching client from pool', err);
                            }
                            for (count = 0; count< 30; count++) {
                            index = count % 10;
                            //sleep(10)
                            console.log(count+"---");
                            client.query('INSERT INTO ghosts(color) VALUES($1) RETURNING ID',[colors[index]], function(err, result) {
                                done(err);

                                if(err) {
                                    return console.error('error running query',err);
                                }
                            });
                        }
                        });
