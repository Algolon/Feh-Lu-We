#!/bin/sh
# PERF-R03-B gates (sequential): visibility smoke on B, P and A, then the region / D3 / W01 browser suites on B.
cd /tmp/claude-0/r3b
G=docs/perf-r03/b/gates; mkdir -p $G
for x in B:4193 P:4191 A:4192; do n=${x%%:*}; p=${x##*:}; [ -f $G/smoke-$n.json ] && continue; node scripts/perf-visibility.mjs http://localhost:$p/Feh-Lu-We/ $G/smoke-$n.json > $G/smoke-$n.log 2>&1; done
for s in e2e-dev04d e2e-dev04d-w01 e2e-dev03 e2e-dev04b; do node scripts/$s.mjs http://localhost:4193/Feh-Lu-We/ > $G/$s-B.log 2>&1; echo "exit $?" >> $G/$s-B.log; done
echo DONE > $G/DONE
