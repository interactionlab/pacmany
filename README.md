# Pac-Many
Pac-Many was developed as a reseach project. Inspired by the original Pac-Man game from 1980 we propose Pac-Many, a multiplayer version designed for large high resolution displays (LHRDs). Similar to the single player version in Pac-Many players navigate their Pac-Man through a maze of Pac-Dots, ghosts, and Power Pellets. While the original maze is 28 tiles wide and 36 tiles tall, this is not sufficient to cover an LHRD. This needs to be adjusted to the display specifications to make use of the high resolution and the size of the display.
>  Sven Mayer, Lars Lischke, Jens Emil Grønbæk, Zhanna Sarsenbayeva, Jonas Vogelsang, Paweł W. Woźniak, Niels Henze and Giulio Jacucci. 2017. Pac-Many: Movement Behavior when Playing Collaborative and Competitive Games on Large Displays. In *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '18)*. ACM, New York, NY, USA, DOI: http://dx.doi.org/10.1145/3173574.3174113

## Setup Pac-Many
Step-by-step instructions:
* Setup a postgres database and update `config.json` accordingly
* `$ npm install`
* `$ npm install -g nodemon`
* `$ npm start`

## How to cite this work

Below is the BibTex entry for citing this work

<pre>
@inproceedings{Mayer:2018:Pacmany,
 title = {Pac-Many: Movement Behavior when Playing Collaborative and Competitive Games on Large Displays},
 author = { Sven Mayer and Lars Lischke and Jens Emil Grønbæk and Zhanna Sarsenbayeva and Jonas Vogelsang and Paweł W. Woźniak and Niels Henze and Giulio Jacucci},
 doi = {10.1145/3173574.3174113},
 year = {2018},
 date = {2018-04-21},
 booktitle = {Proceedings of the 2018 CHI Conference on Human Factors in Computing Systems},
 publisher = {ACM},
 address = {New York, NY, USA},
 series = {CHI'18},
}
</pre>
