#!/bin/sh
# PERF-R03-B matched measurements: P (production), A (P + PERF-R02 + PERF-R03-A), B (A + PERF-R03-B), same harness,
# paths, door sets, fixture and settings (Mobile Low 915 × 412, DPR 1, no shadows). RESUME=1 reruns only missing runs.
# usage: run-measure.sh <name> <baseUrl> <commit>
N=$1; U=$2; export COMMIT=$3 RESUME=1
O=docs/perf-r03/b/measure-$N.json; L=docs/perf-r03/b/measure-$N.log
H="node scripts/perf/visibility-harness.mjs $U $O"
for d in closed partial open; do
  X=; [ $d = closed ] && X=,up-east,entrance
  DOORS=$d PATHS=hall,stair,well,up-west,library,gallery,ground-front,kitchen,upper-rooms$X MODES=B TOPN=0 BREAK=100000000 $H >> $L 2>&1
  DOORS=$d PATHS=hall,well,up-west MODES=A FPS=30 TOPN=0 BREAK=100000000 $H >> $L 2>&1
done
for d in closed partial; do DOORS=$d PATHS=hall,well MODES=A FPS=60 TOPN=0 BREAK=100000000 $H >> $L 2>&1; done
