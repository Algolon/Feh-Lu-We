#!/bin/sh
# PERF-R02 release: the targeted P-vs-C measurement set (scripts/perf/visibility-harness.mjs, RESUME into one file).
# usage: run-targeted.sh <baseUrl> <out.json> <commit>
B=$1; O=$2; export COMMIT=$3 RESUME=1
H="node scripts/perf/visibility-harness.mjs $B $O"
DOORS=open    PATHS=hall,stair,well                  MODES=A,B FPS=30,60 $H
DOORS=open    PATHS=up-west,up-east,library,gallery  MODES=A,B FPS=30    $H
DOORS=open    PATHS=win-north,win-west,win-south     MODES=B             $H
DOORS=partial PATHS=hall,stair,well,up-east,library,gallery MODES=A,B FPS=30 $H
DOORS=closed  PATHS=hall,stair,well,library          MODES=B             $H
