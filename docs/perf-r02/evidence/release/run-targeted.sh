#!/bin/sh
# PERF-R02 release: the targeted P-vs-C measurement set (scripts/perf/visibility-harness.mjs, RESUME into one file;
# rerun after an interruption and only the missing runs are measured).
# usage: run-targeted.sh <baseUrl> <out.json> <commit>
B=$1; O=$2; export COMMIT=$3 RESUME=1
H="node scripts/perf/visibility-harness.mjs $B $O"
DOORS=open    PATHS=hall,stair,well                     MODES=A,B FPS=30 $H
DOORS=open    PATHS=stair                               MODES=A   FPS=60 $H
DOORS=open    PATHS=up-east,library,gallery,win-north,win-west,win-south MODES=B $H
DOORS=partial PATHS=hall,stair,well,gallery             MODES=B          $H
DOORS=closed  PATHS=hall,stair                          MODES=B          $H
