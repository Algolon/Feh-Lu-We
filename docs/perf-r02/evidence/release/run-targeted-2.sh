#!/bin/sh
# PERF-R02 current-production investigation: the targeted set reprioritized (realistic door states first; Mode B).
# RESUME keeps every completed run in the same files. usage: run-targeted-2.sh <baseUrl> <out.json> <commit>
B=$1; O=$2; export COMMIT=$3 RESUME=1
H="node scripts/perf/visibility-harness.mjs $B $O"
DOORS=closed  PATHS=hall,stair,well,up-west             MODES=B          $H
DOORS=partial PATHS=hall,stair,well,up-west             MODES=B          $H
DOORS=open    PATHS=up-west                             MODES=B          $H
DOORS=partial PATHS=hall                                MODES=A FPS=30   $H
DOORS=closed  PATHS=hall                                MODES=A FPS=30   $H
DOORS=open    PATHS=up-east,library,gallery,win-north,win-west,win-south MODES=B $H
DOORS=open    PATHS=stair                               MODES=A   FPS=60 $H
