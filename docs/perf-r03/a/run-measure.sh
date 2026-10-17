#!/bin/sh
# PERF-R03-A matched measurements: P (production), C (P + PERF-R02), R (C + PERF-R03-A), same harness, paths, door
# sets, fixture and settings. RESUME=1: rerun after an interruption and only missing runs are measured.
# usage: run-measure.sh <name> <baseUrl> <commit>
N=$1; B=$2; export COMMIT=$3 RESUME=1
O=docs/perf-r03/a/measure-$N.json; L=docs/perf-r03/a/measure-$N.log
H="node scripts/perf/visibility-harness.mjs $B $O"
for d in closed partial open; do
  DOORS=$d PATHS=hall,stair,well,up-west MODES=B TOPN=0 BREAK=100000000 $H >> $L 2>&1
  DOORS=$d PATHS=hall MODES=A FPS=30 TOPN=0 BREAK=100000000 $H >> $L 2>&1
done
