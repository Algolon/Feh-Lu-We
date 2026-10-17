#!/bin/sh
# PERF-R02 current-production investigation, last steps: hall Mode A at the realistic door states (P and C), then the
# bounded pixel proof of the doorway rule (mUpE / mLib) on C. RESUME keeps every completed run.
cd /tmp/claude-0/int
E=docs/perf-r02/evidence/release
for d in partial closed; do
  DOORS=$d PATHS=hall MODES=A FPS=30 RESUME=1 COMMIT=2404d85 node scripts/perf/visibility-harness.mjs http://localhost:4191/Feh-Lu-We/ $E/targeted-P.json >> $E/targeted-P.log 2>&1 &
  DOORS=$d PATHS=hall MODES=A FPS=30 RESUME=1 COMMIT=b359a71 node scripts/perf/visibility-harness.mjs http://localhost:4192/Feh-Lu-We/ $E/targeted-C.json >> $E/targeted-C.log 2>&1
  wait
done
L=docs/perf-r02/evidence/current-production/lossless
mkdir -p $L
REGIONS=mUpE,mLib MODES=B DOORS=open,partial PATHS=gallery,up-east RESUME=1 node scripts/perf/visibility-lossless.mjs http://localhost:4192/Feh-Lu-We/ $L >> $L/lossless.log 2>&1 &
REGIONS=mUpE,mLib,mUpR,mUpS MODES=B DOORS=open PATHS=win-north,win-west,win-south RESUME=1 node scripts/perf/visibility-lossless.mjs http://localhost:4192/Feh-Lu-We/ $L/windows >> $L/windows.log 2>&1
wait
