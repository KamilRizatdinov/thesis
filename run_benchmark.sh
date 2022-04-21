#!/bin/bash

OUTPUT=${OUTPUT:-"results.csv"}
CASES_DIR=${CASES_DIR:-"./src/cases"}

LANGUAGES=${LANGUAGES:-"javascript assemblyscript"}
CASES=${CASES:-"simple branch-and-bound/nqueens"}

echo "Writing to $OUTPUT"
echo "Case,Language,Compiler,Time (mean in ms),Time (peak in ms),Time (min in ms)" > $OUTPUT

for language in $LANGUAGES ; do
  for case in $CASES ; do
    if [ $language = "javascript" ]
    then
      echo -n "${case},JavaScript,Ignition," | tee -a $OUTPUT
      v8 --no-opt --module ${CASES_DIR}/${case}/${language}/bench.js >> $OUTPUT
      echo "" 
      echo -n "${case},JavaScript,Sparkplug," | tee -a $OUTPUT
      v8 --sparkplug --always-sparkplug --no-opt --module ${CASES_DIR}/${case}/${language}/bench.js  >> $OUTPUT
      echo "" 
      echo -n "${case},JavaScript,Turbofan," | tee -a $OUTPUT
      v8 --module ${CASES_DIR}/${case}/${language}/bench.js  >> $OUTPUT
      echo "" 
    elif [ $language = "assemblyscript" ]
    then
      SRCFILE="${CASES_DIR}/${case}/${language}/index.ts"
      OUTFILE="${CASES_DIR}/${case}/${language}/index.wasm"
      npx asc -o ${OUTFILE} ${SRCFILE}
      echo -n "${case},AssemblyScript,Liftoff," | tee -a $OUTPUT
      echo -n "${case},AssemblyScript,Turbofan," | tee -a $OUTPUT
    else
      echo "${language} is not supported"
    fi
  done
done