#!/bin/bash
cd /tmp/claude-0/r3b
O=/tmp/claude-0/sp/proof/out; mkdir -p $O
U=http://localhost:4193/Feh-Lu-We/
W="timeout 20000 node scripts/perf/window-lossless.mjs $U $O"
RESUME=1 MODES=B DOORS=closed PATHS=upper-rooms,library $W >> $O/log.txt 2>&1
RESUME=1 MODES=B DOORS=partial,open $W >> $O/log.txt 2>&1
RESUME=1 MODES=A DOORS=closed,partial PATHS=hall,stair,well,up-west,library,ground-front,kitchen,gallery,upper-rooms $W >> $O/log.txt 2>&1
RESUME=1 MODES=A FPS=60 TURN=6.28 DOORS=closed PATHS=hall,well,library,upper-rooms,ground-front $W >> $O/log.txt 2>&1
RESUME=1 MODES=B DUSK=0.85 DOORS=closed PATHS=hall,library,ground-front,upper-rooms,kitchen $W >> $O/log.txt 2>&1
RESUME=1 MODES=B DOORS=closed $W >> $O/log.txt 2>&1
echo DONE >> $O/log.txt
