#!/bin/sh
# PERF-R03-A visual proof on R (same-frame comparison with the previous rule: climbers and hedges drawn whenever within
# their distance). RESUME=1: rerun after an interruption and only missing runs are measured.
export EXT=1 REGIONS=extGreen.climbers,frontHedge.left,frontHedge.right RESUME=1
U=$1; D=docs/perf-r03/a
L="node scripts/perf/visibility-lossless.mjs $U"
MODES=B DOORS=closed,open PATHS=hall,stair,well,up-west,up-east,library,gallery,ground-front,kitchen,upper-rooms,front-approach,win-north,win-west,win-south $L $D/lossless-B >> $D/lossless-B.log 2>&1
MODES=B DOORS=partial PATHS=hall,ground-front,upper-rooms $L $D/lossless-B >> $D/lossless-B.log 2>&1
MODES=A FPS=30 DOORS=open PATHS=ground-front,front-approach,upper-rooms,win-west,kitchen,hall $L $D/lossless-A >> $D/lossless-A.log 2>&1
DUSK=0.85 MODES=B DOORS=open PATHS=ground-front,front-approach,upper-rooms,win-north $L $D/lossless-dusk >> $D/lossless-dusk.log 2>&1
