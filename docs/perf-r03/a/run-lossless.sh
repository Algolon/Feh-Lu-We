#!/bin/sh
# PERF-R03-A visual proof on R (same-frame comparison with the previous rule: climbers and hedges drawn whenever within
# their distance). Doors closed: every indoor, room, window and outdoor path. Doors open / partial, movement (Mode A)
# and dusk: the paths where the front door, open interior doors and windows can show the greenery.
# RESUME=1: rerun after an interruption and only missing runs are measured.
export EXT=1 REGIONS=extGreen.climbers,frontHedge.left,frontHedge.right RESUME=1
U=$1; D=docs/perf-r03/a
L="node scripts/perf/visibility-lossless.mjs $U"
MODES=B DOORS=closed PATHS=hall,stair,well,up-west,up-east,library,gallery,ground-front,kitchen,upper-rooms,front-approach,win-north,win-west,win-south $L $D/lossless-B >> $D/lossless-B.log 2>&1
MODES=B DOORS=open PATHS=up-west,hall,ground-front,kitchen,upper-rooms,entrance,front-approach,win-south $L $D/lossless-B >> $D/lossless-B.log 2>&1
MODES=B DOORS=partial PATHS=hall,upper-rooms $L $D/lossless-B >> $D/lossless-B.log 2>&1
MODES=A FPS=30 DOORS=open PATHS=ground-front,entrance,front-approach $L $D/lossless-A >> $D/lossless-A.log 2>&1
DUSK=0.85 MODES=B DOORS=open PATHS=ground-front,front-approach $L $D/lossless-dusk >> $D/lossless-dusk.log 2>&1
