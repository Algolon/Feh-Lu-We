#!/bin/bash
cd /tmp/claude-0/r3b
O=/tmp/claude-0/sp/proof/out; U=http://localhost:4193/Feh-Lu-We/
W="timeout 20000 node scripts/perf/window-lossless.mjs $U $O"
RESUME=1 MODES=A DOORS=closed PATHS=hall,stair,well,up-west,library,ground-front,kitchen,gallery,upper-rooms $W >> $O/log.txt 2>&1
RESUME=1 MODES=A DOORS=partial PATHS=hall,well,library,ground-front $W >> $O/log.txt 2>&1
RESUME=1 MODES=A FPS=60 TURN=6.28 DOORS=closed PATHS=hall,library,upper-rooms,ground-front $W >> $O/log.txt 2>&1
RESUME=1 MODES=B DUSK=0.85 DOORS=closed PATHS=hall,library,upper-rooms,ground-front $W >> $O/log.txt 2>&1
echo DONE >> $O/log.txt
